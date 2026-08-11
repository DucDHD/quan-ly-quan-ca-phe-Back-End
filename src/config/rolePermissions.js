import { PERMISSIONS } from '~/utils/permissions'
import { ROLES } from '~/utils/role'

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    employees: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE,
      PERMISSIONS.DELETE
    ],

    equipments: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE,
      PERMISSIONS.DELETE
    ],
    inventorys: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE,
      PERMISSIONS.DELETE
    ],
    products: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE,
      PERMISSIONS.DELETE
    ]
  },

  [ROLES.MANAGER]: {
    employees: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE
    ],

    equipments: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE
    ],
    inventorys: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE
    ],
    products: [
      PERMISSIONS.VIEW,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE
    ]
  },

  [ROLES.CASHIER]: {
    employees: [PERMISSIONS.VIEW],
    equipments: [PERMISSIONS.VIEW],
    inventorys: [PERMISSIONS.VIEW],
    products: [PERMISSIONS.VIEW]
  },

  [ROLES.BARISTA]: {
    employees: [PERMISSIONS.VIEW],
    equipments: [PERMISSIONS.VIEW],
    inventorys: [PERMISSIONS.VIEW],
    products: [PERMISSIONS.VIEW]
  },

  [ROLES.WAITER]: {
    employees: [PERMISSIONS.VIEW],
    equipments: [PERMISSIONS.VIEW],
    inventorys: [PERMISSIONS.VIEW],
    products: [PERMISSIONS.VIEW]
  }
}