project   = "pulsate-staging"
repo_name = "approvers/pulsate"
location  = "asia-northeast1"
container_images = [{
  name  = "hello"
  image = "ghcr.io/approvers/services/hello"
}]
service_account_name = "github-actions@lateral-attic-400012.iam.gserviceaccount.com"
