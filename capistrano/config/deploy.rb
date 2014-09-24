# config valid only for Capistrano 3.1
lock '3.2.1'

set :application, 'pushserver'
set :repo_url, 'git@bitbucket.org:eliocity/xeepushserver.git'

# Default branch is :master
ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '/var/www/apps/pushserver'

#Default value for linked_dirs is []
set :linked_dirs, %w{certs configs}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
set :keep_releases, 10

namespace :deploy do

  desc "Build"
  task :install_dependencies do
      on roles(:app) do
          within release_path do
              execute :npm, "install"
          end
      end
  end
  after :updated, :install_dependencies
  
  task :restart_services do
    on roles(:app) do      
      execute "sudo supervisorctl restart pushserver_xeecar"
    end
  end

  after "deploy", :restart_services

end
