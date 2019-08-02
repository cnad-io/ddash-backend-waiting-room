pipeline {
  agent {
    label "master"
  }
  environment {
    NON_PROD_NAMESPACE = "dino-dush-non-prod"
    PROD_NAMESPACE = "dino-dush-prod"
    APP_NAME = "waiting-room"
    JENKINS_TAG = "v${BUILD_NUMBER}".replace("/", "-")
  }
  options {
    buildDiscarder(logRotator(numToKeepStr:'10'))
    timeout(time: 20, unit: 'MINUTES')
  }
  stages {
    stage("Prepare B/G Deploy") {
      agent {
        node {
          label "master"
        }
      }
      when {
        expression { GIT_BRANCH ==~ /(.*master)/ }
      }
      steps {
        script {
          echo 'Get active mode'
          env.ACTIVE_MODE = sh (
            script : 'oc get route ${APP_NAME} -o jsonpath="{ .spec.to.name }" -n ${PROD_NAMESPACE}',
            returnStdout: true
          ).trim().replace("${APP_NAME}-", "")
          echo "Active mode: ${ACTIVE_MODE}"
          if ("${ACTIVE_MODE}" == 'blue') {
            env.NOT_ACTIVE_MODE = 'green'
          } else {
            env.NOT_ACTIVE_MODE = 'blue'
          }
          echo "Not Active mode: ${NOT_ACTIVE_MODE}"
        }
      }
    }
    stage("Test and Build code") {
      agent {
        node {
          label "nodejs"
        }
      }
      steps {
        echo 'Running install and audit'
        sh '''
          npm install
          npm audit
        '''
        echo 'Running lint and tests'
        sh '''
          npm run lint
          npm run test:junit-report
        '''

        echo 'Generating container image'
        sh '''
          oc patch bc ${APP_NAME} -p "{\\"spec\\":{\\"output\\":{\\"to\\":{\\"kind\\":\\"ImageStreamTag\\",\\"name\\":\\"${APP_NAME}:${JENKINS_TAG}\\"}}}}" -n ${NON_PROD_NAMESPACE}
          oc start-build ${APP_NAME} --follow -n ${NON_PROD_NAMESPACE}
        '''
      }
      post {
        always {
          junit 'report.xml'
        }
        failure {
          echo "FAILURE"
        }
      }
    }
    stage("Deploy Non Prod") {
      agent {
        node {
          label "master"
        }
      }
      steps {
        echo 'Set image for deployment'
        sh '''
          oc set image dc/${APP_NAME} ${APP_NAME}=${NON_PROD_NAMESPACE}/${APP_NAME}:${JENKINS_TAG} --source=imagestreamtag -n ${NON_PROD_NAMESPACE}
        '''
        script {
          try {
            echo 'Resume deployment'
            sh 'oc rollout resume dc/${APP_NAME} -n ${NON_PROD_NAMESPACE}'
          } catch (error) {}
          try {
            echo 'Rollout deployment'
            sh 'oc rollout latest dc/${APP_NAME} -n ${NON_PROD_NAMESPACE}'
          } catch (error) {}
        }
        echo 'Verify OCP deployment'
        openshiftVerifyDeployment depCfg: env.APP_NAME,
          namespace: env.NON_PROD_NAMESPACE,
          replicaCount: '1',
          verbose: 'false',
          verifyReplicaCount: 'true',
          waitTime: '',
          waitUnit: 'sec'
      }
    }
    stage("B/G Deploy Prod") {
      agent {
        node {
          label "master"
        }
      }
      when {
        expression { GIT_BRANCH ==~ /(.*master)/ }
      }
      steps {
        echo 'Tag image for namespace'
        sh '''
          printenv
          oc tag ${NON_PROD_NAMESPACE}/${APP_NAME}:${JENKINS_TAG} ${PROD_NAMESPACE}/${APP_NAME}:${JENKINS_TAG} -n ${PROD_NAMESPACE}
        '''
        echo '### set env vars and image for deployment ###'
        sh '''
          oc set image dc/${APP_NAME}-${NOT_ACTIVE_MODE} \
            ${APP_NAME}=${PROD_NAMESPACE}/${APP_NAME}:${JENKINS_TAG} --source=imagestreamtag -n ${PROD_NAMESPACE}
        '''
        script {
          try {
            echo 'Resume deployment'
            sh 'oc rollout resume dc/${APP_NAME}-${NOT_ACTIVE_MODE} -n ${PROD_NAMESPACE}'
          } catch (error) {}
          try {
            echo 'Rollout deployment'
            sh 'oc rollout latest dc/${APP_NAME}-${NOT_ACTIVE_MODE} -n ${PROD_NAMESPACE}'
          } catch (error) {}
        }

        sh 'oc scale --replicas=1 dc ${APP_NAME}-${NOT_ACTIVE_MODE} -n ${PROD_NAMESPACE}'
        echo '### Verify OCP Deployment ###'
        openshiftVerifyDeployment depCfg: "${APP_NAME}-${NOT_ACTIVE_MODE}",
          namespace: env.PROD_NAMESPACE,
          replicaCount: '1',
          verbose: 'false',
          verifyReplicaCount: 'true',
          waitTime: '',
          waitUnit: 'sec'

        echo '### Change balance configuration ###'
        sh '''
          oc set route-backends ${APP_NAME} ${APP_NAME}-${ACTIVE_MODE}=0 ${APP_NAME}-${NOT_ACTIVE_MODE}=100 -n ${PROD_NAMESPACE}
        '''
      }
    }
    stage("Approve") {
      agent {
        node {
          label "master"
        }
      }
      when {
        expression { GIT_BRANCH ==~ /(.*master)/ }
      }
      steps {
        script {
          def userInput = false
          try {
            timeout(time: 5, unit: "MINUTES") {
              userInput = input(
                id: 'Proceed1', message: 'Was this successful?', parameters: [
                [$class: 'BooleanParameterDefinition', defaultValue: true, description: '', name: 'Please confirm you agree with this']
                ])
              echo 'userInput: ' + userInput
              if (userInput == true) {
                // do action
                echo "Action was accepted."
                env.WAS_APPROVED = "true"
              } else {
                // not do action
                echo "Action was aborted."
                env.WAS_APPROVED = "false"
              }
            }
          } catch (error) {
            echo "Action was aborted by timeout."
            env.WAS_APPROVED = "false"
          }
        }
      }
    }
    stage("Idle Older Deploy") {
      agent {
        node {
          label "master"
        }
      }
      when {
        expression {
          GIT_BRANCH ==~ /(.*master)/ && WAS_APPROVED == 'true'
        }
      }
      steps {
        script {
          echo 'Idle older deployment'
          try {
            sh 'oc idle ${APP_NAME}-${ACTIVE_MODE} -n ${PROD_NAMESPACE}'
          } catch (error) {}
        }
      }
    }
    stage("Canceling deploy") {
      agent {
        node {
          label "master"
        }
      }
      when {
        expression {
          GIT_BRANCH ==~ /(.*master)/ && WAS_APPROVED == 'false'
        }
      }
      steps {
        echo 'Return balance configuration'
        sh '''
          oc set route-backends ${APP_NAME} ${APP_NAME}-${ACTIVE_MODE}=100 -n ${PROD_NAMESPACE}
        '''
        echo 'Idle latest deployment'
        sh '''
          oc idle ${APP_NAME}-${NOT_ACTIVE_MODE} -n ${PROD_NAMESPACE}
        '''
      }
    }
  }
}
