from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User, SellerProfile, BuyerProfile


class RegistrationForm(UserCreationForm):
    ROLE_CHOICES = [
        ('buyer', 'Buyer — I want to shop'),
        ('seller', 'Seller — I want to sell products'),
    ]
    role = forms.ChoiceField(choices=ROLE_CHOICES, widget=forms.RadioSelect)
    email = forms.EmailField(required=True)
    phone = forms.CharField(max_length=20, required=False)
    first_name = forms.CharField(max_length=50, required=True)
    last_name = forms.CharField(max_length=50, required=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'phone', 'role', 'password1', 'password2']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.phone = self.cleaned_data.get('phone', '')
        user.role = self.cleaned_data['role']
        if commit:
            user.save()
        return user


class LoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'placeholder': 'Username'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Password'}))


class SellerProfileForm(forms.ModelForm):
    class Meta:
        model = SellerProfile
        fields = ['business_name', 'business_description', 'business_address',
                  'bank_name', 'account_number', 'account_holder', 'mobile_money']
        widgets = {
            'business_description': forms.Textarea(attrs={'rows': 3}),
            'business_address': forms.Textarea(attrs={'rows': 2}),
        }


class BuyerProfileForm(forms.ModelForm):
    class Meta:
        model = BuyerProfile
        fields = ['shipping_address', 'city', 'country', 'postal_code']
        widgets = {
            'shipping_address': forms.Textarea(attrs={'rows': 2}),
        }
