pipeline {
  agent any
  // options {
  //   skipDefaultCheckout true
  // }
  environment {
    GH_TOKEN = credentials("gh-pat")
  }
  stages {
    stage("Semantic Release") {
      tools {
        nodejs "node16"
      }
      steps {
        sh "npx semantic-release"
        script {
          COMPUTED_VERSION = sh (script: "git describe --tags", returnStdout: true).trim()
          echo "Computed version: ${COMPUTED_VERSION}"
        }
      }
    }
    stage("Deploy") {
      steps {
        echo "Computed version2: ${COMPUTED_VERSION}"
        sh "whoami"
        sh "docker -v"
        sh "sudo docker -v"
      }
    }
  }
}