import { pick } from 'lodash'

export const pickUser = (user) => {
  if (!user) return {}
  return pick(user, ['EmployeeId', 'FullName', 'Username', 'Address', 'Avatar', 'RoleId', 'Salary', 'Status', 'CreatedAt', 'UpdatedAt'])
}