# See https://docs.chef.io/config_rb_knife.html for more information on knife configuration options
hostname1=`hostname -f`.chomp
current_dir = File.dirname(__FILE__)
log_level                :info
log_location             STDOUT
node_name                "catadmin"
client_key               "#{current_dir}/catadmin.pem"
validation_client_name   "phoenix-validator"
validation_key           "#{current_dir}/phoenix-validator.pem"
chef_server_url          "https://#{hostname1}/organizations/phoenix"
cache_type               'BasicFile'
cache_options( :path => "#{ENV['HOME']}/.chef/checksums" )
cookbook_path            ["#{current_dir}/../cookbooks"]
