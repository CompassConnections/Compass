# Variables
variable "image_url" {
  description = "Docker image URL"
  type        = string
}

variable "env" {
  description = "Environment (env or prod)"
  type        = string
  default     = "prod"
}

# 2. Local Constants
locals {
  project      = "compass-130ba"
  region       = "us-west1"
  service_name = "api"
}

# 3. Provider & Backend
terraform {
  backend "gcs" {
    bucket = "compass-130ba-terraform-state"
    prefix = "api-cloudrun" # Changed prefix so it doesn't collide with old state
  }
}

provider "google" {
  project = local.project
  region  = local.region
}

# The Cloud Run Service
resource "google_cloud_run_v2_service" "api" {
  name     = local.service_name
  location = local.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    startup_cpu_boost = true

    scaling {
      min_instance_count = 0 # This enables scaling to zero (saves money!)
      max_instance_count = 10
    }

    containers {
      image = var.image_url

      resources {
        limits = {
          cpu    = "1" # 1 vCPU is standard, increase to "2" if heavy traffic
          memory = "1Gi"
        }
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "NEXT_PUBLIC_FIREBASE_ENV"
        value = upper(var.env)
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = local.project
      }

      # Optional: CPU Boost speeds up cold starts significantly
      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 1
        period_seconds        = 3
        failure_threshold     = 3
        tcp_socket {
          port = 8080
        }
      }
    }
  }
}

# Allow public (unauthenticated) access to the API
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Free Domain Mapping (Replaces the Load Balancer)
# Note: Check if your region supports 'google_cloud_run_domain_mapping'
# Otherwise, use 'google_cloud_run_v2_domain_mapping'
resource "google_cloud_run_domain_mapping" "api_domain" {
  location = local.region
  name     = "api.compassmeet.com"

  metadata {
    namespace = local.project
  }

  spec {
    route_name = google_cloud_run_v2_service.api.name
  }
}
