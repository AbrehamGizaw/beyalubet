from django import forms
from .models import Product, ProductImage, Category


class ProductForm(forms.ModelForm):
    main_image = forms.ImageField(required=False, label='Product Image')

    class Meta:
        model = Product
        fields = ['title', 'category', 'description', 'price', 'original_price',
                  'stock', 'condition', 'location']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'original_price': forms.NumberInput(attrs={'placeholder': 'Leave blank if no discount'}),
            'location': forms.TextInput(attrs={'placeholder': 'e.g. Addis Ababa, Ethiopia'}),
        }
        help_texts = {
            'original_price': 'Set original price to show discount percentage.',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].queryset = Category.objects.all()
        self.fields['category'].empty_label = '— Select Category —'


class ProductImageForm(forms.ModelForm):
    class Meta:
        model = ProductImage
        fields = ['image', 'is_main']
