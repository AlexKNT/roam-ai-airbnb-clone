import {defineField, defineType} from 'sanity'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const stayTypeOptions = [
  {title: 'Cabin', value: 'cabin'},
  {title: 'Beach', value: 'beach'},
  {title: 'City', value: 'city'},
  {title: 'Villa', value: 'villa'},
]

const amenityOptions = [
  {title: 'Hot Tub', value: 'hot-tub'},
  {title: 'Pet Friendly', value: 'pet-friendly'},
  {title: 'Fast Wi Fi', value: 'fast-wifi'},
  {title: 'Forest Views', value: 'forest-view'},
  {title: 'Ocean View', value: 'ocean-view'},
  {title: 'Mountain Views', value: 'mountain-view'},
  {title: 'Pool', value: 'pool'},
  {title: 'Fireplace', value: 'fireplace'},
  {title: 'Beach Access', value: 'beach-access'},
]

export const stayType = defineType({
  name: 'stay',
  title: 'Stay',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
        isUnique: async (slug, context) => {
          const {document, getClient} = context
          const client = getClient({apiVersion: '2025-02-19'})
          const id = document?._id?.replace(/^drafts\./, '')
          const params = {draft: `drafts.${id}`, published: id, slug}
          const query = `!defined(*[_type == "stay" && !(_id in [$draft, $published]) && slug.current == $slug][0]._id)`

          return client.fetch<boolean>(query, params)
        },
      },
      validation: (rule) =>
        rule.required().custom((value) => {
          const current = value?.current

          if (!current) {
            return 'A slug is required.'
          }

          return slugPattern.test(current)
            ? true
            : 'Use lowercase letters, numbers and single hyphens, for example lake-arrowhead-cabin.'
        }),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {list: stayTypeOptions, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'One short paragraph. This is the text search ranking reads.',
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'Short code or name, for example CA.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      initialValue: 'United States',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pricePerNight',
      title: 'Price per night (USD)',
      type: 'number',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (rule) => rule.required().min(0).max(5).precision(1),
    }),
    defineField({
      name: 'reviewCount',
      title: 'Review count',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'guests',
      title: 'Guests',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'bedrooms',
      title: 'Bedrooms',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'beds',
      title: 'Beds',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'baths',
      title: 'Baths',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'petsAllowed',
      title: 'Pets allowed',
      type: 'boolean',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{type: 'string', options: {list: amenityOptions}}],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      description: 'The first image is the cover.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'galleryImage',
          title: 'Gallery image',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'alt', media: 'image'},
          },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'checkInTime',
      title: 'Check in time',
      type: 'string',
      description: 'Free text, for example 3:00 PM.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'checkOutTime',
      title: 'Check out time',
      type: 'string',
      description: 'Free text, for example 11:00 AM.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'host',
      title: 'Host',
      type: 'reference',
      to: [{type: 'host'}],
      weak: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cancellationPolicy',
      title: 'Cancellation policy',
      type: 'reference',
      to: [{type: 'cancellationPolicy'}],
      weak: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'houseRules',
      title: 'House rules',
      type: 'reference',
      to: [{type: 'houseRules'}],
      weak: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'city', media: 'gallery.0.image'},
  },
})
