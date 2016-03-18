# See https://docs.getchef.com/config_rb_knife.html for more information on knife configuration options

current_dir = File.dirname(__FILE__)
log_level                :info
log_location             STDOUT
node_name                "catadmin"
client_key               "#{current_dir}/catadmin.pem"
validation_client_name   "phoenix-validator"
validation_key           "#{current_dir}/phoenix-validator.pem"
chef_server_url          "https://vagrant-ubuntu-trusty-64/organizations/phoenix"
cookbook_path            ["#{current_dir}/../cookbooks"]
