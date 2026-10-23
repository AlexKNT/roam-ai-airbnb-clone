import {defineField, defineType} from 'sanity'

export const cancellationPolicyType = defineType({
  name: 'cancellationPolicy',
  title: 'Cancellation policy',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'For example Free cancellation.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'string',
      description: 'One line, shown under the refund line.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 6,
      description: 'The wording guests are shown and support quotes word for word.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'summary'},
  },
})
