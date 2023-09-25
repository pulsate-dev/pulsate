resource "google_cloud_run_service" "default" {
  for_each                   = var.container_images
  name                       = each.value.name
  location                   = var.location
  autogenerate_revision_name = true
  template {
    spec {
      containers {
        image = each.value.image
      }
      service_account_name = var.service_account_name
    }
  }
}

output "url" {
  value = google_cloud_run_service.default.status[0].url
}
