let total = 0;
let customerList = [];

function addPayment() {
  const name = document.getElementById('name').value;
  const amount = parseInt(document.getElementById('amount').value);
  const note = document.getElementById('note').value;

  if (!name || !amount || isNaN(amount)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  customerList.push({ name, amount, note });
  total += amount;

  document.getElementById('total').innerText = `Ksh ${total}`;
  updateCustomerList();

  // Clear fields
  document.getElementById('name').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('note').value = '';
}

function updateCustomerList() {
  const list = document.getElementById('customerList');
  list.innerHTML = '';

  customerList.forEach((item, index) => {
    list.innerHTML += `
      <li>
        <strong>${item.name}</strong> - Ksh ${item.amount} (${item.note})
      </li>`;
  });
}
