import mongoose from 'mongoose';

const ShippingMethodSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  carrier: {
    type: String
  },
  estimatedDelivery: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const TaxRateSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 1 // 0 to 1 (0% to 100%)
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const BannerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topBanner', 'heroBanner', 'promoBanner'],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Banner image'
  },
  linkUrl: {
    type: String,
    default: '#'
  },
  caption: {
    type: String,
    default: ''
  },
  subcaption: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'Sinosply'
  },
  storeDescription: {
    type: String,
    default: 'Your premier online shopping destination'
  },
  contactEmail: {
    type: String,
    default: 'info@sinosply.com'
  },
  contactPhone: {
    type: String,
    default: '+233 XX XXX XXXX'
  },
  currency: {
    type: String,
    default: 'GH₵'
  },
  defaultTaxRate: {
    type: Number,
    default: 0.15 // 15%
  },
  banners: {
    type: [BannerSchema],
    default: [
      {
        type: 'topBanner',
        imageUrl: 'https://us.princesspolly.com/cdn/shop/files/UpTo70_OffShoes-Feb25-S_NH-HP-Strip-Banner_2_1599x.progressive.jpg?v=1740695249',
        alt: 'Sale Banner',
        linkUrl: '#',
        isActive: true
      },
      {
        type: 'heroBanner',
        imageUrl: 'https://us.princesspolly.com/cdn/shop/files/Group_3312_6cf6ba2e-a5b6-4f66-94c7-70210e935b86_1599x.progressive.jpg?v=1740713873',
        alt: 'Hero Image',
        linkUrl: '#',
        isActive: true
      }
    ]
  },
  shippingMethods: {
    type: [ShippingMethodSchema],
    default: [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '3-5 business days',
        price: 5.99,
        carrier: 'DHL',
        estimatedDelivery: '3-5 business days',
        isActive: true
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '1-2 business days',
        price: 14.99,
        carrier: 'FedEx',
        estimatedDelivery: '1-2 business days',
        isActive: true
      },
      {
        id: 'sameday',
        name: 'Same Day Delivery',
        description: 'Delivered today (order before 2pm)',
        price: 24.99,
        carrier: 'Local Courier',
        estimatedDelivery: 'Today',
        isActive: true
      }
    ]
  },
  taxRates: {
    type: [TaxRateSchema],
    default: [
      {
        countryCode: 'GH',
        country: 'Ghana',
        rate: 0.15,
        isActive: true
      },
      {
        countryCode: 'NG',
        country: 'Nigeria',
        rate: 0.075,
        isActive: true
      },
      {
        countryCode: 'KE',
        country: 'Kenya',
        rate: 0.16,
        isActive: true
      },
      {
        countryCode: 'ZA',
        country: 'South Africa',
        rate: 0.15,
        isActive: true
      }
    ]
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  orderUpdates: {
    type: Boolean,
    default: true
  },
  customerMessages: {
    type: Boolean,
    default: true
  },
  lowInventoryAlerts: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  // This ensures only one document exists in the collection
  collection: 'settings'
});

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  
  if (settings) {
    return settings;
  }
  
  // Create default settings if none exist
  return await this.create({});
};

const Settings = mongoose.model('Settings', SettingsSchema);

export default Settings; 