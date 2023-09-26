variable "access_token" {
  description = "An acceess token for login to GCP"
  type        = string
  default     = null
}

variable "project" {
  description = "A name of a GCP project"
  type        = string
  default     = null
}

variable "project_id" {
  description = "A project id of a GCP project"
  type        = string
  default     = null
}

variable "repo_name" {
  description = "github repository name"
  default     = "approvers/pulsate"
}

variable "location" {
  description = "A location of a cloud run instance"
  type        = string
  default     = "asia-northeast1"
}

variable "container_images" {
  description = "docker container images"
  type = list(object({
    name  = string
    image = string
  }))
  default = []
}

variable "service_account_name" {
  description = "Email address of the IAM service account"
  type        = string
  default     = ""
}

variable "gke_num_nodes" {
  description = "Total node count on GKE pool"
  type        = number
  default     = 1
}
