# config/deploy/production.rb
server "", :app
set :user, ""
set :password, ""
ssh_options[:keys] = ['""']
ssh_options[:port] = 22
set :use_sudo, false
set :node_user, ""
