// AkShopOnline Main JavaScript

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
  const alerts = document.querySelectorAll('.alert.alert-dismissible');
  alerts.forEach(function (alert) {
    setTimeout(function () {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 5000);
  });

  // Role card selection highlight
  const roleCards = document.querySelectorAll('.role-card');
  roleCards.forEach(function (card) {
    const radio = card.querySelector('input[type="radio"]');
    if (radio) {
      card.addEventListener('click', function () {
        roleCards.forEach(c => c.classList.remove('border-primary', 'bg-primary-subtle'));
        card.classList.add('border-primary', 'bg-primary-subtle');
        radio.checked = true;
      });
      if (radio.checked) {
        card.classList.add('border-primary', 'bg-primary-subtle');
      }
    }
  });

  // Image preview on file input
  const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
  imageInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        let preview = input.parentElement.querySelector('.image-preview');
        if (!preview) {
          preview = document.createElement('img');
          preview.className = 'image-preview mt-2 rounded border';
          preview.style.maxHeight = '150px';
          preview.style.maxWidth = '100%';
          input.parentElement.appendChild(preview);
        }
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  });

  // Confirm delete actions
  const deleteButtons = document.querySelectorAll('[data-confirm]');
  deleteButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (!confirm(this.dataset.confirm)) {
        e.preventDefault();
      }
    });
  });
});
