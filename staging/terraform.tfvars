project    = "pulsate-staging"
project_id = "pulsate-staging-400117"
repo_name  = "approvers/pulsate"
location   = "asia-northeast1"
container_images = [{
  name  = "hello"
  image = "ghcr.io/approvers/services/hello"
}]
service_account_name = "staging-deploy-from-github-act@pulsate-staging-400117.iam.gserviceaccount.com"
