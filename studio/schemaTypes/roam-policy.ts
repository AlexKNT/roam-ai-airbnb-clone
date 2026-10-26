import {defineField, defineType} from 'sanity'
import {roamPolicyTopicIds} from './roam-policy-topics'

export const roamPolicyType = defineType({
  name: 'roamPolicy',
  title: 'Roam policy',
  type: 'document',
  description: 'Policy wording Roam owns, shown word for word by the policy chat.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shown as the answer heading and as its source.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'string',
      description: 'One line, in case the policy is listed somewhere later.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 8,
      description: 'The wording guests are shown and support quotes word for word.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Chat topic',
      type: 'string',
      description: 'The chat topic this policy answers. One policy per topic.',
      options: {
        list: roamPolicyTopicIds.map((id) => ({title: id, value: id})),
        layout: 'dropdown',
      },
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value) return true

          const id = context.document?._id?.replace(/^drafts\./, '')
          const duplicate = await context
            .getClient({apiVersion: '2025-02-19'})
            .fetch(
              `count(*[_type == "roamPolicy" && topic == $topic && !(_id in [$id, $draftId])])`,
              {topic: value, id, draftId: `drafts.${id}`},
            )

          return duplicate > 0 ? 'Another Roam policy already answers this topic' : true
        }),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'topic'},
  },
})
