#!/bin/bash
npm run coverage
node ci/createBadges.js
