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
  is_prod = var.env == "prod"
  # Prod and dev live in separate GCP/Firebase projects. env=dev targets the dev
  # Firebase project so the API talks to the dev Auth/Firestore/Storage backends.
  project      = local.is_prod ? "compass-130ba" : "compass-57c3c"
  region       = "us-west1"
  service_name = "api"
  api_domain   = local.is_prod ? "api.compassmeet.com" : "api.dev.compassmeet.com"
}

# 3. Provider & Backend
# State stays in the prod bucket but is isolated per environment via Terraform
# workspaces (default = prod, `terraform workspace new dev` for dev). The gcs
# backend automatically namespaces named workspaces, so dev/prod never collide.
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

# The Identity
resource "google_service_account" "api_runtime_sa" {
  project      = local.project
  account_id   = "api-runtime-sa"
  display_name = "Cloud Run API Runtime Identity"
}

# The Minimum Permissions
# 1. Allow it to write logs (Essential for debugging)
resource "google_project_iam_member" "log_writer" {
  project = local.project
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.api_runtime_sa.email}"
}

# 2. Allow it to pull data from Artifact Registry (Required to start)
resource "google_project_iam_member" "artifact_viewer" {
  project = local.project
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.api_runtime_sa.email}"
}

resource "google_project_iam_member" "secretAccessor" {
  project = local.project
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.api_runtime_sa.email}"
}

resource "google_project_iam_member" "metric_writer" {
  project = local.project
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.api_runtime_sa.email}"
}

resource "google_project_iam_member" "firebase_auth_admin" {
  project = local.project
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${google_service_account.api_runtime_sa.email}"
}

resource "google_project_iam_member" "fcm_admin" {
  count   = local.is_prod ? 1 : 0
  project = local.project
  role    = "roles/firebase.messagingAdmin"
  member  = "serviceAccount:${google_service_account.api_runtime_sa.email}"
}

# The Cloud Run Service
resource "google_cloud_run_v2_service" "api" {
  name     = local.service_name
  location = local.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api_runtime_sa.email

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
        # CPU Boost speeds up cold starts significantly
        startup_cpu_boost = true
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
        timeout_seconds       = 240
        period_seconds        = 240
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
  name     = local.api_domain

  metadata {
    namespace = local.project
  }

  spec {
    route_name = google_cloud_run_v2_service.api.name
  }
}
