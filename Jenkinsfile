pipeline {

    agent any

    environment {

        IMAGE_NAME = "pulkitgo/api-service"
        TAG = "latest"
    }

    stages {

        stage('Clone') {

            steps {

                checkout scm
            }
        }

        stage('Build Docker Image') {

            steps {

                sh '''
                docker build \
                -t $IMAGE_NAME:$TAG \
                ./api-service
                '''
            }
        }

        stage('Push To DockerHub') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {

                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

                    docker push $IMAGE_NAME:$TAG
                    '''
                }
            }
        }

        stage('Deploy With Ansible') {

            steps {

                sh '''
                ansible-playbook ansible/deploy.yml
                '''
            }
        }
    }
}
