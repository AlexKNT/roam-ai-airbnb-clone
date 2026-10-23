import {defineField, defineType} from 'sanity'

export const houseRulesType = defineType({
  name: 'houseRules',
  title: 'House rules',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rules',
      title: 'Rules',
      type: 'array',
      of: [{type: 'string'}],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'rules'},
  },
})
