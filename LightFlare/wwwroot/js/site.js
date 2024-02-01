// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

$(function () {
    var publicKey = localStorage.getItem('publicKey');
    if (publicKey != null) {
        $('#loginMenu').css('display', 'none');
        $('#logoutMenu').css('display', 'block');
    }
    else {
        $('#loginMenu').css('display', 'block');
        $('#logoutMenu').css('display', 'none');
    }

    var lightNetwork = localStorage.getItem('lightnetwork');
    if (lightNetwork != null) {
        $('#networkLightLink').text(lightNetwork);
    }
    else {
        $('#networkLightLink').text('Mainnet');
    }
})

function changeNetwork() {
    var lightNetwork = localStorage.getItem('lightnetwork');
    if (lightNetwork != null) {
        localStorage.setItem('lightnetwork', lightNetwork == 'Testnet'? 'Mainnet':'Testnet');
    }
    else {
        localStorage.setItem('lightnetwork', 'Testnet');
    }
    location.reload();
}

function getWeb3Provider() {
    var web3 = new Web3(new Web3.providers.HttpProvider("https://replicator.pegasus.lightlink.io/rpc/v1"));
    var lightnetwork = localStorage.getItem('lightnetwork');
    if (lightnetwork != null && lightnetwork == 'Testnet') {
        web3 = new Web3(new Web3.providers.HttpProvider("https://replicator.pegasus.lightlink.io/rpc/v1"));
    }
    else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://replicator.phoenix.lightlink.io/rpc/v1"));
    }
    return web3;
}

var contractPublic = null;

async function getContract(userAddress) {
    var web3 = getWeb3Provider();
    contractPublic = await new web3.eth.Contract(contractABI, contractIdTestnet);
    if (userAddress != null && userAddress != undefined) {
        contractPublic.defaultAccount = userAddress;
    }
}



var pools = [];
var myPools = [];
var balances = [];

function createNewAccount() {
    var web3 = getWeb3Provider();
    const keyring = web3.eth.accounts.create();
    $('.newAccountPublicKey').text(keyring.address);
    $('.newAccountPrivateKey').text(keyring.privateKey);
}

function confirmNewAccount() {
    var publicKey = $('.newAccountPublicKey').text();
    var privateKey = $('.newAccountPrivateKey').text();
    var passWord = $('.newpassWord').val();
    if (passWord == null) {
        alert('Please, add a new password for your wallet.');
    }
    var web3 = getWeb3Provider();
    web3.eth.accounts.wallet.clear();
    web3.eth.accounts.wallet.add(privateKey);
    localStorage.setItem('publicKey', publicKey);
    web3.eth.accounts.wallet.save(passWord);
    location.href = "/Wallet/Index";
}

function login() {
    var web3 = getWeb3Provider();
    if (localStorage.getItem('web3js_wallet') == null) {
        alert('You do not have an associated Lightlink account. Please register an existing account or create a new.');
    }
    else {
        var privateKey = $('.password').val();
        var account = web3.eth.accounts.wallet.load(privateKey)[0];
        localStorage.setItem('publicKey', account.address);
        location.href = "/Wallet/Index";
    }

}

function loginExistingAccount() {
    var web3 = getWeb3Provider();
    var privateKey = $('.privateKeyAccount').val();
    var passWord = $('.newPassword').val();
    if (passWord == null) {
        alert('Please, add a new password for your wallet.');
    }
    localStorage.setItem('publicKey', web3.eth.accounts.privateKeyToAccount(privateKey).address);
    web3.eth.accounts.wallet.clear();
    web3.eth.accounts.wallet.add(privateKey);
    web3.eth.accounts.wallet.save(passWord);
    location.href = "/Wallet/Index";
}

function logout() {
    var publicKey = localStorage.getItem('publicKey');
    //web3.eth.accounts.wallet.clear();
    localStorage.removeItem('publicKey');
    location.href = "/Home/Login";
}

function getBalances() {
    var web3 = getWeb3Provider();
    var publicKey = localStorage.getItem('publicKey');
    var network = localStorage.getItem('lightnetwork');
    var urlBlockscout = network != null ? (network == 'Mainnet' ? 'https://phoenix.lightlink.io/api/v2' : 'https://pegasus.lightlink.io/api/v2') : 'https://phoenix.lightlink.io/api/v2';
    
    const settings = {
        "async": true,
        "crossDomain": true,
        "url": urlBlockscout + "/addresses/" + publicKey + "/token-balances",
        "method": "GET"
    };
    $.ajax(settings).done(async function (response) {
        var ethToken = await web3.eth.getBalance(publicKey)
        var ethBalance = Web3.utils.fromWei(ethToken,"ether");
        var urlToken = network != null ? (network == 'Mainnet' ? 'https://phoenix.lightlink.io/token/' : 'https://pegasus.lightlink.io/token/') : 'https://phoenix.lightlink.io/token/';
        $('#lightBalanceAccount').text(ethBalance);
        var list = document.querySelector('.tokenList');
        var table = document.createElement('table');
        var thead = document.createElement('thead');
        var tbody = document.createElement('tbody');

        var theadTr = document.createElement('tr');
        var contractNameHeader = document.createElement('th');
        contractNameHeader.innerHTML = 'Token';
        theadTr.appendChild(contractNameHeader);
        var contractTickerHeader = document.createElement('th');
        contractTickerHeader.innerHTML = 'Ticker';
        theadTr.appendChild(contractTickerHeader);
        var balanceHeader = document.createElement('th');
        balanceHeader.innerHTML = 'Balance';
        theadTr.appendChild(balanceHeader);
        var usdHeader = document.createElement('th');
        usdHeader.innerHTML = 'USD';
        theadTr.appendChild(usdHeader);

        thead.appendChild(theadTr)

        table.className = 'table';
        table.appendChild(thead);
        for (j = 0; j < response.length; j++) {
            var tbodyTr = document.createElement('tr');
            var contractTd = document.createElement('td');
            var urlToken = urlToken + response[j].token.address;
            contractTd.innerHTML = "<b> <a href='" + urlToken + "' target='_blank''>" + response[j].token.name + "</a></b>";
            tbodyTr.appendChild(contractTd);
            var contractTickerTd = document.createElement('td');
            contractTickerTd.innerHTML = '<b>' + response[j].token.symbol + '</b>';
            tbodyTr.appendChild(contractTickerTd);
            balances.push(contractTickerTd);
            var balanceTd = document.createElement('td');
            balanceTd.innerHTML = '<b>' + response[j].value + '</b>';
            tbodyTr.appendChild(balanceTd);
            var balanceUSDTd = document.createElement('td');
            balanceUSDTd.innerHTML = '<b>' + response[j].token.exchange_rate + '</b>';
            tbodyTr.appendChild(balanceUSDTd);
            tbody.appendChild(tbodyTr);
        }
        table.appendChild(tbody);

        list.appendChild(table);
    });
}

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}


function renderTable(filter_by_availability) {
    var pools_render = pools.sort(dynamicSort('annualized_fee')).reverse();;
    if (filter_by_availability) {
        pools_render = pools_render.filter(x => x.token_0_available == true || x.token_1_available == true)
    }
    var tbody = document.getElementById('tbody_pools');

    $("#tbody_pools").empty();

    for (var i = 0; i < pools_render.length; i++) {
        var tr = "<tr>";
        var url = pools_render[i].dex_name == "diffusion" ? "https://app.diffusion.fi/#/add/v2/" + pools_render[i].exchange : "https://app.evmoswap.org/add/EVMOS/" + pools_render[i].exchange;
        /* Must not forget the $ sign */
        tr += "<td> " + pools_render[i].dex_name + "</td>" + "<td>" + pools_render[i].token_0_contract_name + " (" + pools_render[i].token_0_contract_ticker_symbol + ")</td>" + "<td>" + pools_render[i].token_1_contract_name + " (" + pools_render[i].token_1_contract_ticker_symbol + ")</td>" + "<td>" + pools_render[i].total_liquidity_quote + "</td>" + "<td>" + pools_render[i].block_height + "</td>" + "<td>" + (pools_render[i].annualized_fee * 100).toFixed(2) + "%" + "</td></tr>";

        /* We add the table row to the table body */
        tbody.innerHTML += tr;
    }
}

function getTransactions() {
    var publicKey = localStorage.getItem('publicKey');
    var network = localStorage.getItem('lightnetwork');
    var urlBlockscout = network != null ? (network == 'Mainnet' ? 'https://phoenix.lightlink.io/api/v2' : 'https://pegasus.lightlink.io/api/v2') : 'https://phoenix.lightlink.io/api/v2';
    const settings = {
        "async": true,
        "crossDomain": true,
        "url": urlBlockscout + "/addresses/" + publicKey+"/transactions?filter=to%20%7C%20from",
        "method": "GET"
    };
    $.ajax(settings).done(function (response) {
        var urlToken = network != null ? (network == 'Mainnet' ? 'https://phoenix.lightlink.io/tx/' : 'https://pegasus.lightlink.io/tx/') : 'https://phoenix.lightlink.io/tx/';
        var urlAddress = network != null ? (network == 'Mainnet' ? 'https://phoenix.lightlink.io/address/' : 'https://pegasus.lightlink.io/address/') : 'https://phoenix.lightlink.io/address/';
        if (response.items.length == 0) {
            $('#noTransactions').css('display', 'block');
            $('#noTransactions').text('There is no transaction for this address.');
        }
        else {
            $('#noTransactions').css('display', 'none');
            var list = document.querySelector('.transactionList');
            var table = document.createElement('table');
            var thead = document.createElement('thead');
            var tbody = document.createElement('tbody');


            var theadTr = document.createElement('tr');
            var contractNameHeader = document.createElement('td');
            contractNameHeader.innerHTML = 'Trx Hash';
            theadTr.appendChild(contractNameHeader);
            var contractTickerHeader = document.createElement('td');
            contractTickerHeader.innerHTML = 'From Address';
            theadTr.appendChild(contractTickerHeader);
            var contractTickerHeader = document.createElement('td');
            contractTickerHeader.innerHTML = 'To Address';
            theadTr.appendChild(contractTickerHeader);
            var balanceHeader = document.createElement('td');
            balanceHeader.innerHTML = 'Amount';
            theadTr.appendChild(balanceHeader);
            var usdHeader = document.createElement('td');
            usdHeader.innerHTML = 'Timestamp';
            theadTr.appendChild(usdHeader);
            var usdHeader = document.createElement('td');
            usdHeader.innerHTML = 'Fees';
            theadTr.appendChild(usdHeader);

            thead.appendChild(theadTr);
            table.className = 'table';
            table.appendChild(thead);

            for (j = 0; j < response.items.length; j++) {
                var tbodyTr = document.createElement('tr');
                var contractTd = document.createElement('td');
                var url = urlToken + response.items[j].hash;
                contractTd.innerHTML = "<b><a href='" + url + "' target='_blank'>" + response.items[j].hash.substring(0, 10) + "...</a></b>";
                tbodyTr.appendChild(contractTd);
                var contractFromTickerTd = document.createElement('td');
                contractFromTickerTd.innerHTML = response.items[j].from != null ? "<b><a href='" + urlAddress + response.items[j].from.hash + "' target='_blank'>" + response.items[j].from.hash.substring(0, 10) + "...</a></b>": "-";
                tbodyTr.appendChild(contractFromTickerTd);
                var contractTickerTd = document.createElement('td');
                contractTickerTd.innerHTML = response.items[j].to != null ? "<b><a href='" + urlAddress + response.items[j].to.hash + "' target='_blank'>" + response.items[j].to.hash.substring(0, 10) + "...</a></b>": "-";
                tbodyTr.appendChild(contractTickerTd);
                var balanceTd = document.createElement('td');
                balanceTd.innerHTML = Web3.utils.fromWei(response.items[j].value.toString(), "ether");
                tbodyTr.appendChild(balanceTd);
                var balanceUSDTd = document.createElement('td');
                balanceUSDTd.innerHTML = response.items[j].timestamp;
                tbodyTr.appendChild(balanceUSDTd);
                var contractIdTd = document.createElement('td');
                contractIdTd.innerHTML = response.items[j].fee != null ? Web3.utils.fromWei(response.items[j].fee.value.toString(), "ether") : '-';
                tbodyTr.appendChild(contractIdTd);
                tbody.appendChild(tbodyTr);
            }
            table.appendChild(tbody);

            list.appendChild(table);
        }
    });
}

async function checkUserEnabled() {
    var walletAddress = localStorage.getItem("publicKey");
    await getContract(walletAddress);

    if (contractPublic != null) {
        var checkUser = await contractPublic.methods.isUserActive().call();
        if (checkUser == true) {
            $(".enableAccount").css("display", "none");
            $("#password").css("display", "none");
            $(".depostiSavigs").css("display", "block");
            $('.checkUser').text("You have this saving account enabled");
            var mySavings = await contractPublic.methods.getSavingsBalance().call();
            mySavings = Web3.utils.fromWei(mySavings, "ether");
            $('.mySavings').text("You have " + mySavings + " ETH in your saving account");
        }
        else {
            $('.checkUser').text("You don't have this saving account enabled");
            $("#password").css("display", "block");
            $(".enableAccount").css("display", "block");
            $(".depostiSavigs").css("display", "none");
        }
    }
}

async function enableUser() {
    var web3 = getWeb3Provider();
    var walletAddress = localStorage.getItem("publicKey");
    await getContract(walletAddress);

    var password = $('#password').val();

    if (password == '') {
        $('.successMessage').css('display', 'none');
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Password is invalid");
        
        return;
    }
    var my_wallet = (await web3.eth.accounts.wallet.load(password))[0];

    if (contractPublic != null) {
        try {
            const query = contractPublic.methods.activateSavings();
            const encodedABI = query.encodeABI();
            const signedTx = await web3.eth.accounts.signTransaction(
                {
                    data: encodedABI,
                    from: walletAddress,
                    //gas: 30000,
                    gasPrice: await web3.eth.getGasPrice(),
                    to: this.contractPublic.options.address
                },
                my_wallet.privateKey,
                false
            );
            var clubId = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            location.reload();
        } catch (e) {
            $('.successContributeClub').css('display', 'none');
            $('#errorTrx').css("display", "block");
            $('#errorTrx').text(e.toString());
            return;
        }
    }
}

async function depositSaving() {
    var web3 = getWeb3Provider();
    var walletAddress = localStorage.getItem("publicKey");
    await getContract(walletAddress);

    var amount = $('#amount').val();

    if (amount == '') {
        $('.successMessage').css('display', 'none');
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Amount (in ETH) is invalid");

        return;
    }

    var password = $('#password2').val();

    if (password == '') {
        $('.successMessage').css('display', 'none');
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Password is invalid");

        return;
    }
    var my_wallet = (await web3.eth.accounts.wallet.load(password))[0];

    if (contractPublic != null) {
        try {
            const query = contractPublic.methods.transferSavings();
            const encodedABI = query.encodeABI();
            const signedTx = await web3.eth.accounts.signTransaction(
                {
                    data: encodedABI,
                    from: walletAddress,
                    //gas: 30000,
                    gasPrice: await web3.eth.getGasPrice(),
                    to: this.contractPublic.options.address,
                    value: Web3.utils.toWei(amount, "ether"),
                },
                my_wallet.privateKey,
                false
            );
            var clubId = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            location.reload();
        } catch (e) {
            $('.successContributeClub').css('display', 'none');
            $('#errorTrx').css("display", "block");
            $('#errorTrx').text(e.toString());
            return;
        }
    }
}

async function withdrawSaving() {
    var web3 = getWeb3Provider();
    var walletAddress = localStorage.getItem("publicKey");
    await getContract(walletAddress);

    var password = $('#password2').val();

    if (password == '') {
        $('.successMessage').css('display', 'none');
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Password is invalid");

        return;
    }
    var my_wallet = (await web3.eth.accounts.wallet.load(password))[0];

    if (contractPublic != null) {
        try {
            const query = contractPublic.methods.withdrawSavings();
            const encodedABI = query.encodeABI();
            const signedTx = await web3.eth.accounts.signTransaction(
                {
                    data: encodedABI,
                    from: walletAddress,
                    //gas: 30000,
                    gasPrice: await web3.eth.getGasPrice(),
                    to: this.contractPublic.options.address
                },
                my_wallet.privateKey,
                false
            );
            var clubId = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            location.reload();
        } catch (e) {
            $('.successContributeClub').css('display', 'none');
            $('#errorTrx').css("display", "block");
            $('#errorTrx').text(e.toString());
            return;
        }
    }
}



async function sendTransaction() {
    var web3 = getWeb3Provider();
    var recipient = $('#trx_address').val();
    if (recipient == '') {
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Recipient is invalid");
        return;
    }
    var amount = $('#trx_amount').val();
    if (amount == '') {
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Amount is invalid");
        return;
    }
    var password = $('#password').val();
    if (amount == '') {
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("Please enter your password");
        return;
    }
    var publicKey = localStorage.getItem('publicKey');
    const gasPrice = await web3.eth.getGasPrice();

    try {


        var my_wallet = (await web3.eth.accounts.wallet.load(password))[0];
        const createTransaction = await web3.eth.accounts.signTransaction({
            from: publicKey,
            to: recipient,
            value: Web3.utils.toWei(amount, "ether"),
            gasPrice: await web3.eth.getGasPrice(),
            //data: ""
        }, my_wallet.privateKey, false);
        var clubId = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text("The transaction was executed successfully");
        location.reload();

    } catch (e) {
        $('#errorTrx').css("display", "block");
        $('#errorTrx').text(e.toString());
        return;
    }
}