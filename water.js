const axios = require('axios')
const fs = require('fs')

function sleep() {
  const duration = Math.random() < 0.5 ? 100 : 200
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

const init = 6017426
const end = 6019070

const result = JSON.parse(fs.readFileSync('./data/temp.json').toString())
const start = result.length ? result[result.length - 1].account : init
const times = end - init + 1

async function doFetch(account_no) {
  const res = await axios.post('YOUR_URL', {account_no}, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }, timeout: 10000
  })
  return res.data;
}

async function fetchList() {
  for (let i = start; i <= end; i++) {
    console.log(i - init + 1, '/', times, ((i - init + 1) * 100 / times).toFixed(2))
    let res
    try {
      res = await doFetch(i)
    } catch (e) {
      console.log('fetchList error', i)
      await sleep(5000)
      res = await doFetch(i)
    }

    handleRes(res, i)
    await sleep()
    if ((i - start) % 10 === 0) {
      writeFile()
    }
  }

  writeFile()
}

function writeFile() {
  console.log('WRITE FILE ...')
  fs.writeFileSync('./data/water.js', `const data = ${JSON.stringify(result)}`)
  fs.writeFileSync('./data/temp.json', JSON.stringify(result))
  console.log('WRITE FILE DONE')
}


function handleRes(res, account) {
  // ispay '0'未支付   '1'已支付
  // balance 余额
  // total_charge 欠费
  const {account_name, address, total_charge, balance, ispay} = res.arrearage

  Object.keys(res).sort().forEach((key, index) => {
    if (['arrearage', 'dateList'].includes(key)) return
    const total = res[key].end_meter - res[key].from_meter
    result.push({
      index,
      account,
      account_name,
      address,
      total_charge,
      balance,
      ispay,
      date: key,
      content: res[key].fee_charge_content.split('<br/>').join(' ; '),
      start: +res[key].from_meter,
      end: +res[key].end_meter,
      total,
      water_charge: +res[key].water_charge, // 水费
      price: total ? (res[key].water_charge / total).toFixed(2) : '',
      fee_charge: +res[key].fee_charge, // 水费
    })
  })

}


fetchList()
