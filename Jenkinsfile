pipeline {
  agent any
  options {
    skipDefaultCheckout true
  }
  environment {
    GH_TOKEN = credentials("gh-pat")
  }
  stages {
    stage("Semantic Release") {
      tools {
        nodejs "node16"
      }
      steps {
        sh "npx semantic-release --branches a --dry-run"
      }
    }
    stage("Deploy") {
      steps {
        sh "whoami"
        sh "docker -v"
        sh "sudo docker -v"
      }
    }
  }
}