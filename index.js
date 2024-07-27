import { StakeWiseSDK, Network } from '@stakewise/v3-sdk'
import * as XLSX from 'xlsx'

let sdk

// vaultsArray is an array of vault objects giving the name and address of the vault
let vaultsArray = []

const networkName = document.getElementById('form-network-name')
const vaultName = document.getElementById('form-vault-name')
const vaultAddress = document.getElementById('form-vault-address')
const submitBtn = document.getElementById('submit-btn')
const deleteBtn = document.getElementById('delete-btn')
const networkEl = document.getElementById('network-name')
const vaultAddressEl = document.getElementById('vault-address-el')
const userAddressEl = document.getElementById('user-address-el')
const userAddressSaveBtn = document.getElementById('user-address-save-btn')
const fromDateEl = document.getElementById('from-date-el')
const fromDateSaveBtn = document.getElementById('from-date-save-btn')
const retrieveRewardsBtn = document.getElementById('retrieve-rewards-btn')
const exportRewardsBtn = document.getElementById('export-rewards-btn')
const rewardsGrid = document.getElementById('rewards-grid')

const genesisVaultAddress = "0xAC0F906E433d58FA868F936E8A43230473652885"

vaultName.addEventListener('change', vaultChanged)
vaultAddress.addEventListener('change', vaultChanged)
submitBtn.addEventListener('click', addVault)
deleteBtn.addEventListener('click', deleteVault)

function vaultChanged() {
    submitBtn.disabled = false
}

function addVault(e) {
    const vaultNameAddr = {
        network: networkName.value,
        name: vaultName.value,
        address: vaultAddress.value
    }
    vaultsArray.push(vaultNameAddr)
    writeCookie(vaultsArray)
    networkEl.value = networkName.value
    networkEl.dispatchEvent(new Event('change'))
    submitBtn.disabled = true
}

function deleteVault(e) {
    e.preventDefault();
    const index = vaultsArray.findIndex((vault) => {
        return (vault.network === networkName.value) 
            && (vault.name === vaultName.value) 
            && (vault.address === vaultAddress.value)
    })
    vaultsArray.splice(index, 1)
    writeCookie(vaultsArray)
    networkName.value = vaultsArray[0].network
    vaultName.value = vaultsArray[0].name
    vaultAddress.value = vaultsArray[0].address
    networkEl.dispatchEvent(new Event('change'))
    deleteBtn.disabled = true
}

// Array to hold data for export to Excel
let exportData

networkEl.addEventListener('change', networkSelectorChanged)
vaultAddressEl.addEventListener('change', vaultSelectorChanged)
userAddressSaveBtn.addEventListener('click', saveUserAddress)
fromDateSaveBtn.addEventListener('click', saveFromDate)
retrieveRewardsBtn.addEventListener('click', retrieveRewards)
exportRewardsBtn.addEventListener('click', exportRewards)

// Default user address
const userAddressCookie = getCookie("defaultUserAddress")
if (userAddressCookie != "") {
    const defaultUserAddress = userAddressCookie.split('=')
    userAddressEl.value = defaultUserAddress[1]
} 

// Default from date
const fromDateCookie = getCookie("defaultFromDate")
if (fromDateCookie != "") {
    const defaultFromDate = fromDateCookie.split('=')
    fromDateEl.value = defaultFromDate[1]
} else {
    fromDateEl.value = '2023-11-29'
}

function getCookie(caddr) {
    let address = caddr + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(address) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function writeCookie(array) {
    const arrayStr = JSON.stringify(array)
    document.cookie = `stakewiseVaults=${arrayStr}`
}

function networkSelectorChanged() {
    const network = networkEl.value
    if (network === "Ethereum") {
        sdk = new StakeWiseSDK({ network: Network.Mainnet })
    } else if (network === "Gnosis") {
        sdk = new StakeWiseSDK({ network: Network.Gnosis })
    } else {
        console.log("Invalid network specified")
    }
    let html = ""
    vaultsArray.forEach((vault) => {
        if (vault.network === network) {
            html += `
                <option 
                    value='${vault.name}: ${vault.address}'>${vault.name}: ${vault.address}
                </option>
            `
        }
    })
    vaultAddressEl.innerHTML = html
    if (vaultsArray.length > 1) {
        deleteBtn.disabled = false
    }
    // Clear rewards grid
    rewardsGrid.innerHTML = ``
}

function vaultSelectorChanged() {
    const nameAddr = vaultAddressEl.value.split(': ')
    vaultName.value = nameAddr[0]
    vaultAddress.value = nameAddr[1]
    if (vaultsArray.length > 1) {
        deleteBtn.disabled = false
    }
    // Clear rewards grid
    rewardsGrid.innerHTML = ``
}

function saveUserAddress() {
    if (userAddressEl.value != "") {
        document.cookie = "defaultUserAddress=" + userAddressEl.value
    } else {
        console.log("No user address entered")
    }
}

function saveFromDate() {
    if (fromDateEl.value != "") {
        document.cookie = "defaultFromDate=" + fromDateEl.value
    } else {
        console.log("No from date entered")
    }
}

async function retrieveRewards() {

    let date
    let localDate
    const options = { year: 'numeric', month: 'short', day: 'numeric' }

    exportData = []

    let jsTimestamp = new Date(fromDateEl.value).getTime()
    const dateFrom = Number((jsTimestamp / 1000).toFixed(0))

    const nameAddr = vaultAddressEl.value.split(': ')
    const input = {
        dateFrom: dateFrom,
        userAddress: userAddressEl.value,
        vaultAddress: nameAddr[1]
    }
    
    const output = await sdk.vault.getUserRewards(input)

    rewardsGrid.innerHTML = `
        <div id="reward-date">Date</div>
        <div id="reward-daily">Daily Rewards</div>
        <div id="reward-sum">Cumulative Rewards</div>
        `
 
    const records = Object.entries(output)

    for (let record of records) {
        date = new Date(record[0] * 1000)
        localDate = new Intl.DateTimeFormat('en-GB', options).format(date)

        rewardsGrid.innerHTML += 
            `
            <div id="reward-date">${localDate}</div>
            <div id="reward-daily">${record[1].dailyRewards}</div> 
            <div id="reward-sum">${record[1].sumRewards}</div>
            `
            
        // Create an array of objects in preparation for exporting to Excel
        let row = new Object();
        row.date = date
        row.daily_reward = record[1].dailyRewards
        row.sum_rewards = record[1].sumRewards
        exportData.push(row)
    }
}

function exportRewards() {
    let ws = XLSX.utils.json_to_sheet(exportData)
    let wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rewards")

    const nameAddr = vaultAddressEl.value.split(': ')
    const name = networkEl.value.toLowerCase() + "_" 
        + nameAddr[0].toLowerCase().replace(/ /g, "_")
    XLSX.writeFile(wb, `${name}_rewards.xlsx`)
}

function setupInputs() {
    const cookie = getCookie("stakewiseVaults")
    if (cookie != "") {
        const array = cookie.split('=')
        vaultsArray = JSON.parse(array[1])
    } else {
        vaultsArray[0] = {
            network: "Ethereum",
            name: "Genesis",
            address: genesisVaultAddress
        }
        writeCookie(vaultsArray)
    }
    networkEl.value=vaultsArray[0].network
    vaultName.value = vaultsArray[0].name
    vaultAddress.value = vaultsArray[0].address
    networkEl.dispatchEvent(new Event('change'))
}

setupInputs()
