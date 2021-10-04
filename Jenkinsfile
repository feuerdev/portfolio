pipeline {
  agent any
  options {
    skipDefaultCheckout true
  }
  stages {
    stage("Deploy") {
      steps {
        sh "whoami"
        docker -v
        sudo docker -v
      }
    }
  }
}