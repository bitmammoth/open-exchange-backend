module.exports = {
  extends: 'standard',
  plugins: [
    'standard',
    'promise'
  ],
  'rules': {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    "handle-callback-err":'off'
  },
  'env':{
    node: true,
    mocha: true
  }
};