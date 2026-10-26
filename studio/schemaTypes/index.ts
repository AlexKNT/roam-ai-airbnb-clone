import {cancellationPolicyType} from './cancellation-policy'
import {hostType} from './host'
import {houseRulesType} from './house-rules'
import {roamPolicyType} from './roam-policy'
import {stayType} from './stay'

export const schemaTypes = [
  stayType,
  hostType,
  cancellationPolicyType,
  houseRulesType,
  roamPolicyType,
]
