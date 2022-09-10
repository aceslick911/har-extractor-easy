#!/usr/bin/env sh

set -m

APP_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed -E 's/[",]|^ +//g')
sed -i '' "/^APP_VERSION=/s/=.*/='v${APP_VERSION}'/" env.sh

cat ./env.sh
source ./env.sh
