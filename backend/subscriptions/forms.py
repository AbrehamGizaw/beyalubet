from django import forms


class PaymentConfirmationForm(forms.Form):
    payment_reference = forms.CharField(
        max_length=100,
        label='Payment Reference / Transaction ID',
        widget=forms.TextInput(attrs={'placeholder': 'e.g. TXN123456789'}),
        help_text='Enter the transaction reference number from your bank or mobile money transfer.'
    )
    confirm = forms.BooleanField(
        label='I confirm that I have made the payment to the account details shown above.',
        required=True
    )
