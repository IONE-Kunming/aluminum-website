export default {
  // التنقل
  nav: {
    dashboard: 'لوحة التحكم',
    catalog: 'كتالوج المنتجات',
    cart: 'سلة التسوق',
    orders: 'طلباتي',
    invoices: 'الفواتير',
    sellers: 'دليل البائعين',
    support: 'الدعم',
    notifications: 'الإشعارات',
    profile: 'الملف الشخصي',
    products: 'منتجاتي',
    branches: 'الفروع',
    signOut: 'تسجيل الخروج'
  },
  
  // عام
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    loading: 'جارٍ التحميل...',
    noData: 'لا توجد بيانات متاحة',
    success: 'نجاح',
    error: 'خطأ',
    warning: 'تحذير',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    submit: 'إرسال',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    close: 'إغلاق'
  },
  
  // المنتجات
  products: {
    title: 'المنتجات',
    addProduct: 'إضافة منتج',
    editProduct: 'تعديل المنتج',
    deleteProduct: 'حذف المنتج',
    bulkImport: 'استيراد جماعي',
    modelNumber: 'رقم الموديل',
    category: 'الفئة',
    pricePerMeter: 'السعر للمتر',
    imagePath: 'مسار الصورة',
    description: 'الوصف',
    stock: 'المخزون',
    uploadExcel: 'تحميل ملف Excel',
    importInstructions: 'قم بتحميل ملف Excel يحتوي على الأعمدة: رقم الموديل، الفئة، السعر للمتر، مسار الصورة',
    selectFile: 'اختر ملف',
    importProducts: 'استيراد المنتجات',
    importSuccess: 'تم استيراد المنتجات بنجاح',
    importError: 'خطأ في استيراد المنتجات'
  },
  
  // لوحة التحكم
  dashboard: {
    welcome: 'مرحباً بك',
    recentOrders: 'الطلبات الأخيرة',
    totalSales: 'إجمالي المبيعات',
    totalProducts: 'إجمالي المنتجات',
    pendingOrders: 'الطلبات المعلقة',
    viewAll: 'عرض الكل'
  },
  
  // الطلبات
  orders: {
    title: 'الطلبات',
    orderNumber: 'رقم الطلب',
    date: 'التاريخ',
    total: 'الإجمالي',
    status: 'الحالة',
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغى'
  },
  
  // سلة التسوق
  cart: {
    title: 'سلة التسوق',
    emptyCart: 'سلة التسوق فارغة',
    total: 'الإجمالي',
    checkout: 'الدفع',
    continueShopping: 'متابعة التسوق',
    removeItem: 'حذف العنصر'
  },
  
  // المصادقة
  auth: {
    login: 'تسجيل الدخول',
    signup: 'التسجيل',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    signIn: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب'
  },
  
  // الملف الشخصي
  profile: {
    title: 'الملف الشخصي',
    displayName: 'اسم العرض',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    buyer: 'مشتري',
    seller: 'بائع',
    updateProfile: 'تحديث الملف الشخصي',
    changePassword: 'تغيير كلمة المرور'
  },
  
  // الصفحة الرئيسية
  landing: {
    nav: {
      features: 'المميزات',
      howItWorks: 'كيف يعمل',
      benefits: 'الفوائد',
      login: 'تسجيل الدخول',
      getStarted: 'ابدأ الآن'
    },
    hero: {
      title: 'حوّل',
      titleHighlight: 'تجارة الألمنيوم',
      titleEnd: 'الخاصة بك',
      description: 'اربط المشترين والبائعين على أحدث منصة لتجارة الألمنيوم. بسّط العمليات، وعزز الكفاءة، ونمّ عملك.',
      startTrading: 'ابدأ التداول',
      learnMore: 'اعرف المزيد',
      stats: {
        activeUsers: 'مستخدم نشط',
        transactions: 'معاملات',
        uptime: 'وقت التشغيل'
      },
      cards: {
        realtime: {
          title: 'التداول في الوقت الفعلي',
          description: 'معالجة وتتبع فوري للطلبات'
        },
        secure: {
          title: 'معاملات آمنة',
          description: 'أمان على مستوى البنوك لجميع الصفقات'
        },
        analytics: {
          title: 'لوحة التحليلات',
          description: 'تتبع الأداء في الوقت الفعلي'
        }
      }
    },
    features: {
      title: 'ميزات قوية',
      subtitle: 'كل ما تحتاجه للنجاح في تجارة الألمنيوم',
      easyOrdering: {
        title: 'طلب سهل',
        description: 'تصفح الكتالوجات، وقارن الأسعار، وقدم الطلبات ببضع نقرات فقط.'
      },
      sellerManagement: {
        title: 'إدارة البائعين',
        description: 'إدارة المخزون، وتتبع الطلبات، وتنمية قاعدة العملاء بسهولة.'
      },
      securePlatform: {
        title: 'منصة آمنة',
        description: 'أمان على مستوى المؤسسات يحمي كل معاملة ونقطة بيانات.'
      },
      lightningFast: {
        title: 'سريع كالبرق',
        description: 'أداء محسّن يضمن أوقات تحميل سريعة وتفاعلات سلسة.'
      },
      invoiceManagement: {
        title: 'إدارة الفواتير',
        description: 'إصدار فواتير آلي وتتبع المدفوعات لمعاملات سلسة.'
      },
      multiUser: {
        title: 'دعم متعدد المستخدمين',
        description: 'وصول قائم على الأدوار للمشترين والبائعين والمسؤولين.'
      }
    },
    howItWorks: {
      title: 'كيف يعمل',
      subtitle: 'ابدأ في ثلاث خطوات بسيطة',
      step1: {
        title: 'إنشاء حساب',
        description: 'سجّل واختر دورك - مشترٍ أو بائع. أكمل ملفك الشخصي في دقائق.'
      },
      step2: {
        title: 'تصفح أو قائمة',
        description: 'يتصفح المشترون الكتالوجات، ويدرج البائعون المنتجات. اتصل بشركاء التداول.'
      },
      step3: {
        title: 'تداول بأمان',
        description: 'أكمل المعاملات بثقة. تتبع الطلبات وإدارة الفواتير بسهولة.'
      }
    },
    benefits: {
      title: 'لماذا تختار I ONE Construction؟',
      industryLeading: {
        title: 'رائد الصناعة',
        description: 'موثوق به من قبل كبار تجار الألمنيوم في جميع أنحاء العالم'
      },
      support247: {
        title: 'دعم على مدار الساعة',
        description: 'مساعدة الخبراء عندما تحتاج إليها'
      },
      businessGrowth: {
        title: 'نمو الأعمال',
        description: 'تحليلات وأدوات لتوسيع عملياتك'
      },
      secureReliable: {
        title: 'آمن وموثوق',
        description: 'أمان على مستوى المؤسسات ووقت تشغيل بنسبة 99.9%'
      },
      stats: {
        fasterProcessing: 'معالجة أسرع',
        costReduction: 'تخفيض التكلفة',
        satisfactionRate: 'معدل الرضا'
      }
    },
    cta: {
      title: 'هل أنت مستعد لتحويل تداولك؟',
      description: 'انضم إلى آلاف التجار الناجحين على منصة I ONE Construction',
      getStarted: 'ابدأ مجانًا'
    },
    footer: {
      companyName: 'I ONE Construction',
      description: 'المنصة الأولى لتجارة الألمنيوم، والتي تربط المشترين والبائعين في جميع أنحاء العالم.',
      product: 'المنتج',
      company: 'الشركة',
      support: 'الدعم',
      aboutUs: 'من نحن',
      contact: 'اتصل بنا',
      careers: 'الوظائف',
      privacyPolicy: 'سياسة الخصوصية',
      helpCenter: 'مركز المساعدة',
      documentation: 'الوثائق',
      community: 'المجتمع',
      status: 'الحالة',
      copyright: '© 2024 I ONE Construction. جميع الحقوق محفوظة.'
    }
  },
  
  // أسماء اللغات
  languages: {
    en: 'English',
    ar: 'العربية',
    zh: '中文'
  }
};
