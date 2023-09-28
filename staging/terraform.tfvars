project    = "pulsate-staging"
project_id = "pulsate-staging-400117"
repo_name  = "approvers/pulsate"
location   = "asia-northeast1-a"
container_images = [{
  name  = "hello"
  image = "ghcr.io/approvers/services/hello"
}]
gke_num_nodes = 1
