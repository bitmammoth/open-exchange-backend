module.exports = {
  extends: 'standard',
  plugins: [
    'standard',
    'promise'
  ],
  'rules': {
    semi: ['error', 'always'],
    quotes: ['error', 'single', {
      "avoidEscape": true
    }],
    "handle-callback-err": 'off',
    "valid-jsdoc": ['error',{
      requireReturnDescription: false,
      requireParamDescription: false,
      requireReturn: false
    }]
  },
  'env':{
    node: true,
    mocha: true
  }
};