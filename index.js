import { StakeWiseSDK, Network } from '@stakewise/v3-sdk'
import * as XLSX from 'xlsx'

const sdk = new StakeWiseSDK({ network: Network.Mainnet })

const vaultAddressEl = document.getElementById('vault-address-el')
const vaultAddressSaveBtn = document.getElementById('vault-address-save-btn')
const userAddressEl = document.getElementById('user-address-el')
const userAddressSaveBtn = document.getElementById('user-address-save-btn')
const fromDateEl = document.getElementById('from-date-el')
const fromDateSaveBtn = document.getElementById('from-date-save-btn')
const retrieveBtn = document.getElementById('retrieve-btn')
const exportBtn = document.getElementById('export-btn')
const retrieveRewardsBtn = document.getElementById('retrieve-rewards-btn')
const exportRewardsBtn = document.getElementById('export-rewards-btn')
const rewardsGrid = document.getElementById('rewards-grid')

// Array to hold data for export to Excel
let exportData = []

vaultAddressSaveBtn.addEventListener('click', saveVaultAddress)
userAddressSaveBtn.addEventListener('click', saveUserAddress)
fromDateSaveBtn.addEventListener('click', saveFromDate)
retrieveRewardsBtn.addEventListener('click', retrieveRewards)
exportRewardsBtn.addEventListener('click', exportRewards)

// Default vault address
const vaultAddressCookie = getCookie("defaultVaultAddress")
if (vaultAddressCookie != "" && vaultAddressEl.value === "") {
    const defaultVaultAddress = vaultAddressCookie.split('=')
    vaultAddressEl.value = defaultVaultAddress[1]
} 

// Default user address
const userAddressCookie = getCookie("defaultUserAddress")
if (userAddressCookie != "") {
    const defaultUserAddress = userAddressCookie.split('=')
    userAddressEl.value = defaultUserAddress[1]
} 

// Default from date
const fromDateCookie = getCookie("defaultFromDate")
if (fromDateCookie != "" && fromDateEl.value === "") {
    const defaultFromDate = fromDateCookie.split('=')
    fromDateEl.value = defaultFromDate[1]
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

function saveVaultAddress() {
    if (vaultAddressEl.value != "") {
        document.cookie = "defaultVaultAddress=" + vaultAddressEl.value
    } else {
        console.log("No vault address entered")
    }
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
        document.cookie = "defaultFromDate=" + vaultAddressEl.value
    } else {
        console.log("No from date entered")
    }
}

async function retrieveRewards() {

    let date
    let localDate
    const options = { year: 'numeric', month: 'short', day: 'numeric' }

    let jsTimestamp = new Date(fromDateEl.value).getTime()
    const dateFrom = Number((jsTimestamp / 1000).toFixed(0))

    const input = {
        dateFrom: dateFrom,
        userAddress: userAddressEl.value,
        vaultAddress: vaultAddressEl.value,
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
    XLSX.writeFile(wb, "stakewise_v3_rewards.xlsx")
}




