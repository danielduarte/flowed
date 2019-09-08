#!/usr/bin/env bash
#title          : updateSonarProps.sh
#description    :
# This script parses the project's name and version from its package.json and automagically
# updates the version and package name in the SonarQube configuration properties file.
# It can be used as a pre step before running the sonar-scanner command
# It also creates a backup of the props file with suffix *.bak
#prerequisites  : NodeJS based project with package.json, sonar*.properties file in the cwd
#author         : Christian-André Giehl <christian@emailbrief.de>
#date           : 20180220
#version        : 1.0
#usage          : sh updateSonarProps.sh
#==============================================================================
echo "Updating the SonarQube properties..."

# Get the version from package.json
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "Extracted version: ${PACKAGE_VERSION}"

# Get the project name from package.json
PACKAGE_NAME=$(cat package.json \
  | grep name \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "Extracted project: ${PACKAGE_NAME}"

# Get the Sonar properties file
SONAR_FILE=$(find ./ -iname sonar*.properties -type f)
echo "Sonar file found: ${SONAR_FILE}"

# Update the version
REPLACE='^sonar.projectVersion=.*$'
WITH="sonar.projectVersion=${PACKAGE_VERSION}"
sed -i.bak "s#${REPLACE}#${WITH}#g" ${SONAR_FILE}

# Update the project name
REPLACE='^sonar.projectName=.*$'
WITH="sonar.projectName=${PACKAGE_NAME}"
sed -i.bak "s#${REPLACE}#${WITH}#g" ${SONAR_FILE}

echo "Done!"
