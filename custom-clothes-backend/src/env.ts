const getEnv = (name: string) => {
  console.log(process.env.ACCESS_KEY)
  const value = process.env[name]
  
  if(!value){
    return "Error"
  }
  
  return value
}

export const env = {
  JWT_SECRET_ACCESS: getEnv('ACCESS_KEY'),
  JWT_SECRET_REFRESH: getEnv("REFRESH_KEY"),
};