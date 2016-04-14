# See https://docs.getchef.com/config_rb_knife.html for more information on knife configuration options

current_dir = File.dirname(__FILE__)
log_level                :info
log_location             STDOUT
node_name                "opensource"
client_key               "#{current_dir}/opensource.pem"
validation_client_name   "opensource-validator"
validation_key           "#{current_dir}/opensource-validator.pem"
chef_server_url          "https://chefservercat.cloudapp.net/organizations/opensource"
cookbook_path            ["#{current_dir}/../cookbooks"]
