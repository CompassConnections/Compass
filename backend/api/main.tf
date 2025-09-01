variable "image_url" {
  description = "Docker image URL"
  type        = string
  default     = "us-west1-docker.pkg.dev/compass-130ba/builds/api:latest"
}

variable "env" {
  description = "Environment (env or prod)"
  type        = string
  default     = "prod"
}

locals {
  project = "compass-130ba"
  region  = "us-west1"
  zone         = "us-west1-b"
  service_name = "api"
  machine_type = "e2-small"
}

terraform {
  backend "gcs" {
    bucket = "compass-130ba-terraform-state"
    prefix = "api"
  }
}

provider "google" {
  project = local.project
  region  = local.region
  zone    = local.zone
}

# Firebase Storage Buckets
# Note you still have to deploy the rules: `firebase deploy --only storage`
resource "google_storage_bucket" "public_storage" {
  name          = "compass-130ba-public"
  location      = "US"
  force_destroy = false

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}


# static IPs
resource "google_compute_global_address" "api_lb_ip" {
  name = "api-lb-ip-2"
  address_type = "EXTERNAL"
}

resource "google_compute_managed_ssl_certificate" "api_cert" {
  name = "api-lb-cert-1"

  managed {
    domains = ["api.compassmeet.com"]
  }
}

# Instance template with your Docker container
resource "google_compute_instance_template" "api_template" {
  name_prefix  = "${local.service_name}-"
  machine_type = local.machine_type

  tags = ["lb-health-check"]

  disk {
    source_image = "cos-cloud/cos-stable" # Container-Optimized OS
    auto_delete  = true
    boot         = true
  }

  network_interface {
    network = "default"
    subnetwork = "default"
    access_config {
      network_tier = "PREMIUM"
    }
  }

  service_account {
    scopes = ["cloud-platform"]
  }

  metadata = {
    gce-container-declaration = <<EOF
spec:
  containers:
    - image: '${var.image_url}'
      env:
      - name: NEXT_PUBLIC_FIREBASE_ENV
        value: ${upper(var.env)}
      - name: GOOGLE_CLOUD_PROJECT
        value: ${local.project}
      ports:
        - containerPort: 80
EOF
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Managed instance group (for 1 VM)
resource "google_compute_region_instance_group_manager" "api_group" {
  name               = "${local.service_name}-group"
  base_instance_name = "${local.service_name}-group"
  region               = local.region
  target_size        = 1

  version {
    instance_template = google_compute_instance_template.api_template.id
    name = "primary"
  }

  update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_unavailable_fixed = 0
    max_surge_fixed       = 3
  }

  named_port {
    name = "http"
    port = 80
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.api_health_check.id
    initial_delay_sec = 300
  }
}

resource "google_compute_health_check" "api_health_check" {
  name                = "${local.service_name}-health-check"
  check_interval_sec  = 5
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 10

  tcp_health_check {
    port = "80"
  }
}

# Backend service
resource "google_compute_backend_service" "api_backend" {
  name        = "${local.service_name}-backend"
  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 30

  health_checks = [google_compute_health_check.api_health_check.id]

  backend {
    group = google_compute_region_instance_group_manager.api_group.instance_group
  }

  log_config {
    enable = true
  }
}

# URL map
resource "google_compute_url_map" "api_url_map" {
  name            = "${local.service_name}-url-map"
  default_service = google_compute_backend_service.api_backend.id

  host_rule {
    hosts        = ["*"]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.api_backend.self_link
  }
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "api_https_proxy" {
  name             = "${local.service_name}-https-proxy"
  url_map          = google_compute_url_map.api_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.api_cert.id]
}

# Global forwarding rule (load balancer frontend)
resource "google_compute_global_forwarding_rule" "api_https_forwarding_rule" {
  name       = "${local.service_name}-https-forwarding-rule-2"
  target     = google_compute_target_https_proxy.api_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.api_lb_ip.id
}

# HTTP-to-HTTPS redirect
resource "google_compute_url_map" "api_http_redirect" {
  name = "${local.service_name}-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "api_http_proxy" {
  name    = "${local.service_name}-http-proxy"
  url_map = google_compute_url_map.api_http_redirect.id
}

resource "google_compute_global_forwarding_rule" "api_http_forwarding_rule" {
  name       = "${local.service_name}-http-forwarding-rule"
  target     = google_compute_target_http_proxy.api_http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.api_lb_ip.id
}


# Firewalls

resource "google_compute_firewall" "allow_health_check" {
  name    = "allow-health-check-${local.service_name}"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["lb-health-check"]
}

resource "google_compute_firewall" "default_allow_https" {
  name        = "default-allow-http"
  network     = "default"
  priority    = 1000
  direction   = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"] # ["443", "8090-8099"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# resource "google_compute_firewall" "default_allow_ssh" {
#   name        = "default-allow-ssh"
#   network     = "default"
#   priority    = 65534
#   direction   = "INGRESS"
#
#   allow {
#     protocol = "tcp"
#     ports    = ["22"]
#   }
#
#   source_ranges = ["0.0.0.0/0"]
# }
#
# resource "google_compute_firewall" "default_allow_internal" {
#   name        = "default-allow-internal"
#   network     = "default"
#   priority    = 65534
#   direction   = "INGRESS"
#
#   allow {
#     protocol = "tcp"
#     ports    = ["0-65535"]
#   }
#
#   allow {
#     protocol = "udp"
#     ports    = ["0-65535"]
#   }
#
#   allow {
#     protocol = "icmp"
#   }
#
#   source_ranges = ["10.128.0.0/9"]
# }
#
# # Allow ICMP (ping)
# resource "google_compute_firewall" "default_allow_icmp" {
#   name        = "default-allow-icmp"
#   network     = "default"
#   priority    = 65534
#   direction   = "INGRESS"
#
#   allow {
#     protocol = "icmp"
#   }
#
#   source_ranges = ["0.0.0.0/0"]
# }
