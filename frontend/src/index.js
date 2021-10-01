import { ethers } from "ethers"
import ICOJSON from '../../artifacts/contracts/ICO.sol/ICO.json'

const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const ICOaddress = '0x6C1f90a316C7e39DcAfcF98bf51a8700af27b2DD'
const contract = new ethers.Contract(ICOaddress, ICOJSON.abi, signer);

window.provider = provider
window.signer = signer
window.contract = contract


async function connectToMetamask() {
  try {
    const address = await signer.getAddress()
    console.log("Signed in")
  }
  catch(err) {
    console.log("Not signed in")
    await provider.send("eth_requestAccounts", [])
  }
}

async function gatherMainContractInfo() {
  try {
    const tokens = await contract.getPurchasedTokens()
    document.getElementById('purchased-tokens').textContent = tokens;
  } catch(err) {
    displayError(err.message)
  }
}

document.getElementById('buy-button').onclick = async function buyTokens() {
  try {
    const tokens = await contract.reserveTokens()
  } catch (err) {
    displayError(err.message)
  }
}

function displayError(error) {
  const errorSpan = document.createElement('span')
  errorSpan.innerHTML = error
  document.body.appendChild(errorSpan)
}

async function go() {
  await connectToMetamask()
  await gatherMainContractInfo()
}

go()