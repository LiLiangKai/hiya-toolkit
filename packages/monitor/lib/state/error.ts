export interface IError {
  message?: string
  stack?: string
  url?: string
  count?: number
}

let errors: IError[] = []
let record: {
  [key: string]: IError
} = {}

export function resetErrors () {
  errors = []
  record = {}
}

export function _getErrors () {
  return errors
}

export function pushError (error: IError) {
  try {
    error = {...error}
    error.url = error.url || window.location.href
    const key = `${error.url}_${error.message}`
  
    if(record[key]) {
      record[key].count = (record[key].count || 1) + 1
    } else {
      error.count = 1
      errors.push(error)
      record[key] = error
    }
  } catch (err) {}
}

export function getErrors () {
  return JSON.parse(JSON.stringify(errors))
}