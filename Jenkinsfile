pipeline {
  agent any
  options {
    skipDefaultCheckout true
  }
  stages {
    stage("Deploy") {
      steps {
        sh "whoami"
        sh "docker -v"
        sh "sudo docker -v"
      }
    }
  }
}