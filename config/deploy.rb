require "capistrano/node-deploy"
require 'capistrano/ext/multistage'

set :application, "node-encoder"
set :repository,  "git@github.com:gabceb/node-encoder.git"
set :scm, :git
set :deploy_to, "/mnt/node-encoder"
set :node_binary, "/usr/local/bin/node"

default_run_options[:pty] = true

# Set app command to run (defaults to index.js, or your `main` file from `package.json`)
set :app_command, "server.js"
set :stages, %w(production vagrant)
set :ssh_options, { :forward_agent => true }