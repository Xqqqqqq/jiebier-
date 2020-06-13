import { ShoppingCart } from '../../../api-models/shoppingCart/shoppingCart';
const shoppingCart = new ShoppingCart();
import { Index } from '../../../api-models/index/index';
const index = new Index();
const { $Toast } = require('../../../dist/base/index');
import { wx_gotoNewUrl } from '../../../utils/fn'
//获取应用实例
const app = getApp()
Page({
  data:{
    url: app.globalData.url,
    clickName: '完成',
    showDelete: false,
    isAllSelect: false,
    totalMoney: 0,
    goodsList:[],
    goodsLength: 0,
    typeList:[], // 弹出层用
    showMask: false,
    deleteList:[], //需要删除的id数组
  },
  onShow(){
    this.setData({
      isAllSelect: false,
      goodsList: [],
      totalMoney: 0,
    })
    this.getDictAll()
  },
  // 获取用户字典 
  getDictAll(){
    let couponStateList = []
    let goodsList = []
    index.getDict({ dictType: 'delivery_type' }).then(res => {
      if(res.code == 200){
        couponStateList = res.result
        shoppingCart.selectCartByUserId({
          userId: '1'
        }).then(res => {
          if(res.code == 200){
            let goodsLength = 0
            goodsList = res.result.map(item => {
              return {
                ...item,
                isSelect: false
              }
            })
            for(let i = 0; i < goodsList.length; i++){
              goodsLength += goodsList[i].productList.length
            }
            if(goodsList && couponStateList){
              this.setData({
                goodsList:this.findDictLabel(goodsList, couponStateList)
              })
            }
            this.getTotalPrice()
            this.setData({
              goodsList: goodsList,
              goodsLength: goodsLength
            })
          }else{
            $Toast({
              content: res.msg,
              type: 'error'
            });
          }
        })
      }else {
        $Toast({
          content: res.msg,
          type: 'error'
        });
      }
    })
  },
  // 数据字典-列表转换
  findDictLabel(sourceData, dicData){
    let newSourceData = sourceData.filter(item => item)
    newSourceData.forEach(item => {
      item.productList.forEach(productItem => {
        const dictData = dicData.find(dicItem => Number(dicItem.dictValue) === productItem.deliveryType)
        productItem.deliveryLabel = dictData ? dictData.dictLabel :''
      })
    })
    return newSourceData
  },
  changeName(){
    if(this.data.clickName == '编辑'){
      this.setData({
        clickName: '完成',
        showDelete: false
      })
    }else if(this.data.clickName == '完成'){
      this.setData({
        clickName: '编辑',
        showDelete: true
      })
    }
  },
  // 点击商品自提打开蒙层
  openMask(){
    this.setData({
      showMask: true
    })
  },
  closeMask(){
    this.setData({
      showMask: false
    })
  },
  radioChange(e){
    console.log(e.detail.value)
  },
  // 点击门店旁的checkbox
  switchSelect(e){
    let goodsList = this.data.goodsList
    const index = e.currentTarget.dataset.index
    let selectNum = 0 // 统计选中商品
    const isSelect = goodsList[index].isSelect
    goodsList[index].isSelect = !isSelect
    for(let i=0;i<goodsList.length; i++){
      if(goodsList[i].isSelect == true){
        selectNum++
        goodsList[i].productList.map(itemSmall => {
          itemSmall.isSmallSelect = true
        })
      }else{
        goodsList[i].productList.map(itemSmall => {
          itemSmall.isSmallSelect = false
        })
      }
    }
    if(selectNum == goodsList.length){
      this.setData({
        isAllSelect: true
      })
    }else{
      this.setData({
        isAllSelect: false
      })
    }
    this.getTotalPrice()
    this.setData({
      goodsList: goodsList
    })
  },
  // 点击商品旁边的checkbox
  goodsSelect(e){
    let selectNum = 0 // 统计选中商品
    let selectAllNum = 0 // 统计全部选中商品
    const index = e.currentTarget.dataset.index
    const indexsmall = e.currentTarget.dataset.indexsmall
    let goodsList = this.data.goodsList
    const isSmallSelect = goodsList[index].productList[indexsmall].isSmallSelect
    goodsList[index].productList[indexsmall].isSmallSelect = !isSmallSelect
    // 统计每个门店的选中商品
    for(let j=0; j< goodsList[index].productList.length; j++){
      if(goodsList[index].productList[j].isSmallSelect == true){
        selectNum++
      }
    }
    if(selectNum == goodsList[index].productList.length){
      goodsList[index].isSelect = true
    }else{
      goodsList[index].isSelect = false
    }
    // 统计全部选中的商品
    for(let i=0;i<goodsList.length; i++){
      if(goodsList[i].isSelect == true){
        selectAllNum++
      }
    }
    if(selectAllNum == goodsList.length){
      this.setData({
        isAllSelect: true
      })
    }else{
      this.setData({
        isAllSelect: false
      })
    }
    this.getTotalPrice()
    this.setData({
      goodsList: goodsList,
    })
  },
  // 商品全选
  selectAll(){
    let isAllSelect = this.data.isAllSelect
    isAllSelect = !isAllSelect
    let goodsList = this.data.goodsList
    for(let i =0; i <goodsList.length; i++){
      goodsList[i].isSelect = isAllSelect
      for(let j = 0; j <goodsList[i].productList.length; j++){
        goodsList[i].productList[j].isSmallSelect = isAllSelect
      }
    }
    this.getTotalPrice()
    this.setData({
      isAllSelect: isAllSelect,
      goodsList: goodsList
    })
  },
  // 点击加减商品
  quantityChange(e){
    const index = e.currentTarget.dataset.index
    const indexsmall = e.currentTarget.dataset.indexsmall
    let goodsList = this.data.goodsList
    let quantity = goodsList[index].productList[indexsmall].productNum
    if(e.currentTarget.id == 'sub'){
      if(quantity <= 1){
        $Toast({
          content: '该宝贝不能减少了哦~',
          type: 'warning'
        });
        return
      }else{
        quantity -= 1
      }
    }else if(e.currentTarget.id == 'add'){
      quantity += 1
    }
    goodsList[index].productList[indexsmall].productNum = quantity
    this.getTotalPrice()
    this.setData({
      goodsList: goodsList
    })
  },
  // 计算总价
  getTotalPrice(){
    let goodsList = this.data.goodsList
    let total = 0
    for(let i =0; i < goodsList.length; i++){ 
      for(let j =0; j <goodsList[i].productList.length; j++){
        if(goodsList[i].productList[j].isSmallSelect){
          total += Number(goodsList[i].productList[j].productNum) * Number(goodsList[i].productList[j].productPrice)
        }
      }
    }
    this.setData({
      goodsList: goodsList,
      totalMoney: total.toFixed(2)
    })
  },
  // 删除
  clickDelete(){
    this.data.deleteList = []
    for(let i =0; i< this.data.goodsList.length; i++){
      for(let j =0; j< this.data.goodsList[i].productList.length; j++){
        if(this.data.goodsList[i].productList[j].isSmallSelect && this.data.goodsList[i].productList[j].isSmallSelect == true){
          this.data.deleteList.push(this.data.goodsList[i].productList[j].id)
        }
      }
    }
    this.data.deleteList = this.data.deleteList.join(',')
    if(this.data.deleteList.length >0){
      shoppingCart.delCart({
        ids: this.data.deleteList
      }).then(res => {
        if(res.code ==200){
          $Toast({
            content: res.msg,
            type: 'success'
          });
          this.setData({
            isAllSelect: false,
            goodsList: [],
            totalMoney: 0,
          })
          this.getDictAll()
        }else{
          $Toast({
            content: res.msg,
            type: 'error'
          });
        }
      })
    }else{
      $Toast({
        content: '请先选择想要删除的宝贝！',
        type: 'warning'
      });
    }
  }
})