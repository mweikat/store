const port = 8080;
export const environment = {
  production: false,
  api_store:'http://localhost:'+port+'/api/v1/catalog',
  apiAuth:'http://localhost:'+port+'/api/v1/auth',
  api_business:'http://localhost:'+port+'/api/v1/business',
  api_shipping_business:'http://localhost:'+port+'/api/v1/shipping_business',
  api_shipping_client:'http://localhost:'+port+'/api/v1/shipping',
  api_order:'http://localhost:'+port+'/api/v1/order',
  api_user:'http://localhost:'+port+'/api/v1/user',
  defaultBusinessName:'lil',
  recaptcha: {
    siteKey: '6Le5aYAqAAAAAIF5xZy5EPN4-LTzA_F3tB_5amKl',
  },
  url_recaptcha:'https://www.google.com/recaptcha/api.js?render=',
  googleClientIdlogin:'184950648114-63vf1pluj62ru4b3f1n6loo4dshlkuil.apps.googleusercontent.com'
};