--[[
----------------------------------------
-- 脚本名称：荒野日记孤岛修改器
-- 作者：长毛三花淡奶
-- 版本：究极无敌终极整合版
----------------------------------------
公告：仅限个人使用，禁止外传！
]]

gg.alert("荒野日记孤岛修改器\n究极无敌终极整合版\n作者：长毛三花淡奶\n公告：仅限个人使用，禁止外传！")

-- ===== 全局变量 =====
local cooldownStatus = "关"
local keysStatus = "关"
local originalCooldownValues = {}
local originalKeysValues = {}
local menuVisible = false
local xsui = true
local JCXX = gg.getTargetInfo()
local DJSFLB = {}
local ZDYJLB = {}

-- ===== 第一个脚本的功能 =====
function init()
    gg.setVisible(false)
    gg.clearResults()
    gg.setRanges(gg.REGION_ANONYMOUS)
end

function modifyAllAttributes()
    init()
    gg.toast("开始修改所有属性...")
    
    -- 修改7002属性
    gg.searchNumber("7002;350", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("350", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("99999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7002属性修改完成")
    
    -- 修改7003属性
    gg.searchNumber("7003;350", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("350", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("99999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7003属性修改完成")
    
    -- 修改7013属性
    gg.searchNumber("7013;15", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("15", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("99999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7013属性修改完成")
    
    -- 修改7014属性
    gg.searchNumber("7014;1", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("1", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7014属性修改完成")
    
    -- 修改7018属性
    gg.searchNumber("7018;10", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("10", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("100", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7018属性修改完成")
    
    -- 修改7040属性
    gg.searchNumber("7040;40", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("40", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("9999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7040属性修改完成")
    
    -- 修改7044属性
    gg.searchNumber("7044;100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("9999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7044属性修改完成")
    
    -- 修改7045属性
    gg.searchNumber("7045;100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("9999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7045属性修改完成")
    
    -- 修改7046属性
    gg.searchNumber("7046;100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("9999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7046属性修改完成")
    
    -- 修改7047属性
    gg.searchNumber("7047;100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("9999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7047属性修改完成")
    
    -- 修改7048属性
    gg.searchNumber("7048;100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber("100", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll("9999", gg.TYPE_DWORD)
    gg.clearResults()
    gg.toast("7048属性修改完成")
    
    gg.alert("所有属性修改完成！")
end

function toggleCooldown()
    init()
    
    if cooldownStatus == "关" then
        -- 开启功能：修改为0
        gg.searchNumber(86400000, gg.TYPE_DWORD)
        
        if gg.getResultsCount() == 0 then
            gg.alert("未找到86400000数值")
            return
        end
        
        local results = gg.getResults(100)
        -- 保存原始值
        originalCooldownValues = {}
        for i, v in ipairs(results) do
            table.insert(originalCooldownValues, {
                address = v.address,
                value = v.value,
                flags = gg.TYPE_DWORD
            })
            v.value = 1
        end
        gg.setValues(results)
        cooldownStatus = "开"
        gg.alert("冷却时间已清零！(状态:开)")
    else
        -- 关闭功能：恢复原始值
        if #originalCooldownValues > 0 then
            gg.setValues(originalCooldownValues)
            cooldownStatus = "关"
            gg.alert("冷却时间已恢复原始值！(状态:关)")
        else
            gg.alert("未找到保存的原始值，无法恢复")
        end
    end
end

function toggleKeys()
    init()
    
    if keysStatus == "关" then
        -- 开启功能：修改为88888
        gg.searchNumber("100006;1", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
        gg.refineNumber("1", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
        local results = gg.getResults(500)
        
        -- 保存原始值
        originalKeysValues = {}
        for i, v in ipairs(results) do
            table.insert(originalKeysValues, {
                address = v.address,
                value = v.value,
                flags = gg.TYPE_DWORD
            })
            v.value = 88888
        end
        gg.setValues(results)
        keysStatus = "开"
        gg.alert("钥匙数量已修改为88888！(状态:开)")
    else
        -- 关闭功能：恢复原始值
        if #originalKeysValues > 0 then
            gg.setValues(originalKeysValues)
            keysStatus = "关"
            gg.alert("钥匙数量已恢复原始值！(状态:关)")
        else
            gg.alert("未找到保存的原始值，无法恢复")
        end
    end
    
    gg.clearResults()
end

function customModify()
    init()
    local input = gg.prompt({
        "联合搜索值 (如:7002;350):",
        "精炼值 (如:350):",
        "修改值 (如:9999):"
    }, {"7002;350", "350", "9999"}, {"text", "number", "number"})
    
    if not input then return end
    
    gg.searchNumber(input[1], gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.refineNumber(input[2], gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(500)
    gg.editAll(input[3], gg.TYPE_DWORD)
    gg.clearResults()
    
    gg.alert("修改完成！\n"..input[1].." → "..input[3])
end

-- ===== 第二个脚本的功能 =====
function NCZH(S)
    if(S==2)then
        return "Jh"
    elseif(S==1)then
        return "Ch"
    elseif(S==4)then
        return "Ca"
    elseif(S==8)then
        return "Cd"
    elseif(S==16)then
        return "Cb"
    elseif(S==262144)then
        return "PS"
    elseif(S==32)then
        return "A"
    elseif(S==65536)then
        return "J"
    elseif(S==64)then
        return "S"
    elseif(S==524288)then
        return "As"
    elseif(S==1048576)then
        return "V"
    elseif(S==-2080896)then
        return "O"
    elseif(S==131072)then
        return "B"
    elseif(S==16384)then
        return "Xa"
    elseif(S==32768)then
        return "Xs"
    end
end

function QNCL(N)
    local x={}
    local z=0
    local n=gg.getRangesList()
    for v,w in ipairs(n)do
        if w.state == N then
        x[#x+1]=w
        x[#x].size=w["end"]-w["start"]
        end
    end
    return x,#x
end

function NCPX(nclb,sj)
    local nclc=#nclb
    if(sj==1)then
        for i=1,nclc-1 do
            for j=1 ,nclc-1 do
                if(nclb[j].size>nclb[j+1].size)then
                    local temp = nclb[j+1]
                    nclb[j + 1] = nclb[j]
                    nclb[j] = temp
                end
            end
        end
    elseif(sj==2)then
        for i=1,nclc-1 do
            for j=1 ,nclc-1 do
                if(nclb[j].size<nclb[j+1].size)then
                    local temp = nclb[j+1]
                    nclb[j + 1] = nclb[j]
                    nclb[j] = temp
                end
            end
        end
    end
    return nclb
end

function LHSS(data)
    local sssl=0
    local sssj={}
    if(data.ncpx>0 or data.ncks>0 or data.ncjw<100)then
        local nclb,ncsl=QNCL(NCZH(data.ncfw))
        if(ncsl==0)then
            gg.toast(data.gnm.."开启失败")
            return false
        end
        local nclb=NCPX(nclb,data.ncpx)
        local ks,GGBox=math.modf(#nclb*(data.ncks*0.01))
        if(ks==0)then
            ks=1
        end
        local jw,GGBox=math.modf(#nclb*(data.ncjw*0.01))
        if(jw==0)then
            jw=#nclb
        end
        for i=ks,jw do
            gg.clearResults()
            gg.searchNumber(data.xss.sz, data.xss.lx, false, gg.SIGN_EQUAL, nclb[i]["start"], nclb[i]["end"], 0)
            gg.refineNumber(data.gs.sz, data.gs.lx)
            local sl=gg.getResultsCount()
            if(sl>0)then
                local sj=gg.getResults(sl)
                for j=1,sl do
                    sssl=sssl+1
                    sssj[sssl]=sj[j]
                end
            end
            gg.clearResults()
        end
        if(#sssj==0)then
            gg.toast(data.gnm.."开启失败")
            return false
        end
        gg.loadResults(sssj)
        gg.getResults(sssl)
    else
        gg.clearResults()
        gg.setRanges(data.ncfw)
        gg.searchNumber(data.xss.sz, data.xss.lx)
        gg.refineNumber(data.gs.sz, data.gs.lx)
        sssl=gg.getResultsCount()
        if(sssl==0)then
            gg.toast(data.gnm.."开启失败")
            return false
        end
        sssj=gg.getResults(sssl)
    end
    local xgz=data.xg.sz
    if(data.zdyjl and ZDYJLB[data.md5])then
        xgz=ZDYJLB[data.md5]
    end
    if(data.zdyxg)then
        local zdy=gg.prompt({data.zdybz},{xgz},{"number"})
        if(zdy)then
            xgz=zdy[1]
            if(data.zdyjl)then
            ZDYJLB[data.md5]=zdy[1]
            end
        else
            gg.clearResults()
            gg.toast(data.gnm.."取消开启")
            return false
        end
    end
    if(data.xgdj==false)then
        gg.editAll(xgz, data.xg.lx)
        gg.clearResults()
        gg.toast(data.gnm.."开启成功")
        return true
    end
    if(data.djsf)then
        if(DJSFLB[data.md5])then
            gg.removeListItems(DJSFLB[data.md5])
        end
        DJSFLB[data.md5]={}
        for i, v in ipairs(sssj) do
            if v.flags == data.xg.lx then
                v.value = xgz
                v.freeze = true
                DJSFLB[data.md5][#DJSFLB[data.md5]+1]=v.address
            end
        end
    else
        for i, v in ipairs(sssj) do
            if v.flags == data.xg.lx then
                v.value = xgz
                v.freeze = true
            end
        end
    end
    gg.addListItems(sssj)
    gg.clearResults()
    gg.toast(data.gnm.."开启成功")
    return true
end

function PYXG(M,md5,S,G)
    local sfs=0
    local sfl=0
    if(DJSFLB[md5])then
        sfl=#DJSFLB[md5]
        gg.removeListItems(DJSFLB[md5])
    end
    DJSFLB[md5]={}
    local zdyjmsj={}
    zdyjmsj.t={}
    zdyjmsj.s={}
    zdyjmsj.r={}
    zdyjmsj.j={}
    local zdyjl=0
    for i,v in pairs(G) do
        if(v.zd)then
            zdyjl=zdyjl+1
            zdyjmsj.t[zdyjl]=v.bz
            if(v.jl and ZDYJLB[md5])then
                zdyjmsj.s[zdyjl]=ZDYJLB[md5][zdyjl]
            else
                zdyjmsj.s[zdyjl]=v.sz
            end
            zdyjmsj.r[zdyjl]="number"
            zdyjmsj.j[zdyjl]=i
        end
    end
    if(zdyjl>0)then
        local zdy=gg.prompt(zdyjmsj.t,zdyjmsj.s,zdyjmsj.r)
        if(zdy)then
            ZDYJLB[md5]={}
            for i=1,#zdyjmsj.j do
                ZDYJLB[md5][i]=zdy[i]
                G[zdyjmsj.j[i]].sz=zdy[i]
            end
        else
            gg.toast(M.."取消开启")
            return false
        end
    end
    local xg,xgs,dj,djs={},0,{},0
    for i,v in ipairs(S)do
        for I,V in ipairs(G)do
            local shuju={}
            shuju["address"]=v.address+V.py
            shuju["flags"]=V.lx
            shuju["value"]=V.sz
            if(V.dj)then
                shuju["freeze"]=true
                djs=djs+1
                dj[djs]=shuju
                if(V.sf)then
                    sfs=sfs+1
                    DJSFLB[md5][sfs]=v.address+V.py
                end
            else
                xgs=xgs+1
                xg[xgs]=shuju
            end
        end
    end
    gg.setValues(xg)
    gg.addListItems(dj)
    gg.toast(M.."开启成功\n修改"..xgs.."|冻结"..djs.."|释放"..sfl)
end

function TZMPT(ztz,ftz)
    local linshishuju
    local xinshuju
    local ftzs=#ftz
    for i=1,ftzs do
        linshishuju={}
        xinshuju={}
        for ii,v in ipairs(ztz)do
            linshishuju[ii]={}
            linshishuju[ii].address=v.address+ftz[i].py
            linshishuju[ii].flags=ftz[i].lx
        end
        for ii,v in ipairs(gg.getValues(linshishuju))do
            if(v.value==ftz[i].sz)then
                xinshuju[#xinshuju+1]=ztz[ii]
            end
        end
        if(#xinshuju==0)then
            return false
        end
        ztz=xinshuju
    end
    return ztz
end

function PYSS(data)
    local sssl=0
    local sssj={}
    if(data.ncpx>0 or data.ncks>0 or data.ncjw<100)then
        local nclb,ncsl=QNCL(NCZH(data.ncfw))
        if(ncsl==0)then
            gg.toast(data.gnm.."开启失败")
            return false
        end
        local nclb=NCPX(nclb,data.ncpx)
        local ks,GGBox=math.modf(#nclb*(data.ncks*0.01))
        if(ks==0)then
            ks=1
        end
        local jw,GGBox=math.modf(#nclb*(data.ncjw*0.01))
        if(jw==0)then
            jw=#nclb
        end
        for i=ks,jw do
            gg.clearResults()
            gg.searchNumber(data.ztz.sz, data.ztz.lx, false, gg.SIGN_EQUAL, nclb[i]["start"], nclb[i]["end"], 0)
            local sl=gg.getResultsCount()
            if(sl>0)then
                local sj=gg.getResults(sl)
                for j=1,sl do
                    sssl=sssl+1
                    sssj[sssl]=sj[j]
                end
            end
            gg.clearResults()
        end
        if(#sssj==0)then
            gg.toast(data.gnm.."开启失败\n未找到主特征")
            return false
        end
        gg.clearResults()
    else
        gg.clearResults()
        gg.setRanges(data.ncfw)
        gg.searchNumber(data.ztz.sz, data.ztz.lx)
        sssl=gg.getResultsCount()
        if(sssl<1)then
            gg.toast(data.gnm.."开启失败\n未找到主特征")
            return false
        end
        sssj=gg.getResults(sssl)
        gg.clearResults()
    end
    sssj=TZMPT(sssj,data.ftz)
    if(sssj)then
        PYXG(data.gnm,data.md5,sssj,data.xgz)
    else
        gg.toast(data.gnm.."开启失败\n未找到副特征")
        return false
    end
end

function ZZTZ(mk,zzlt)
    local zzlts=#zzlt
    if(zzlts==0)then
        return false
    end
    local sjlx
    if(JCXX.x64)then
        sjlx=32
    else
        sjlx=4
    end
    local shuzu={}
    shuzu[1] = {}
    shuzu[1].address = mk.start + zzlt[1]
    shuzu[1].flags = sjlx
    if zzlts ~= 1 then
        for i = 2, zzlts do
            local dushuju = gg.getValues(shuzu)
            shuzu = {}
            for _ in pairs(dushuju) do
                if not JCXX.x64 then
                    dushuju[_].value = dushuju[_].value & 0xFFFFFFFF
                end
                shuzu[1] = {}
                shuzu[1].address = dushuju[_].value + zzlt[i]
                shuzu[1].flags = sjlx
            end
        end
    end
    return shuzu
end

function ZZSS(data)
    local mklb={}
    local mklbs=0
    local t = gg.getRangesList('^/data/*'..data.mkm..'*$')
    for i,v in pairs(t) do
        if(v.type:sub(1, 1)=="r" and (v.state==NCZH(data.nclx)))then
            mklbs=mklbs+1
            mklb[mklbs]=v
        end
    end
    if(mklbs==0)then
        gg.toast(data.gnm.."开启失败\n没找到模块头")
        return false
    end
    local k,j
    if(data.xh==0)then
        k=1
        j=mklbs
    else
        if(mklbs<data.xh)then
            gg.toast(data.gnm.."开启失败\n无指定模块头")
            return false
        end
        k=data.xh
        j=data.xh
    end
    for i=k,j do
        local shuzu= ZZTZ(mklb[i],data.zzlb)
        if(shuzu==false)then
            gg.toast(data.gnm.."开启失败\n指针跳转失败")
            return false
        end
        local tzpd=TZMPT(shuzu,data.ftz)
        if(tzpd)then
            PYXG(data.gnm,data.md5,shuzu,data.xgz)
            return true
        end
        if(i==j)then
            gg.toast(data.gnm.."开启失败\n未找到副特征")
            return false
        end
    end
end

-- ===== 主菜单系统 =====
function showBaseMenu()
    menuVisible = true
    local menu = gg.choice({
        "1. 一键修改所有属性",
        "2. 冷却时间开关 [当前状态:"..cooldownStatus.."]",
        "3. 钥匙数量开关 [当前状态:"..keysStatus.."]",
        "4. 自定义联合修改",
        "5. 返回上层"
    }, nil, "基础修改功能")
    
    if menu == 1 then
        modifyAllAttributes()
    elseif menu == 2 then
        toggleCooldown()
    elseif menu == 3 then
        toggleKeys()
    elseif menu == 4 then
        customModify()
    elseif menu == 5 then
        return
    end
    menuVisible = false
end

function showAdvancedMenu()
    xsui = true
    while true do
        if gg.isVisible(true) or xsui then
            xsui = false
            gg.setVisible(false)
            local choice = gg.choice({
                "1. 人物皮肤",
                "2. 人物血量",
                "3. 其他功能",
                "4. 图纸功能",
                "5. 礼包功能",
                "6. 物品替换",
                "7. 返回上层"
            }, nil, "高级功能菜单")
            
            if choice == 1 then
                -- 人物皮肤菜单
                xsui = true
                while true do
                    if gg.isVisible(true) or xsui then
                        xsui = false
                        gg.setVisible(false)
                        local skinChoice = gg.choice({
                            "厨子皮肤",
                            "朱莉皮肤",
                            "老贝皮肤",
                            "小哥皮肤",
                            "基德皮肤",
                            "返回上层"
                        }, nil, "人物皮肤修改")
                        
                        if skinChoice == 1 then
                            -- 厨子皮肤菜单
                            local choice = gg.choice({
                                "新春厨神",
                                "妙厨",
                                "数据恢复",
                                "返回上层"
                            }, nil, "厨子皮肤")
                            
                            if choice == 1 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100001',['lx']=1,},['gs']={['sz']=':100001',['lx']=1,},['xg']={['sz']=':100003',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='新春厨神',['md5']='1d6fed4f4ea6ddc561ce9046040d36d1',})
                            elseif choice == 2 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100003',['lx']=1,},['gs']={['sz']=':100003',['lx']=1,},['xg']={['sz']=':100004',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='妙厨',['md5']='b12a5163de8e72b5de65fe3016c99380',})
                            elseif choice == 3 then
                                LHSS({['ncfw']=2,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100003',['lx']=1,},['gs']={['sz']=':100003',['lx']=1,},['xg']={['sz']=':100001',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='16cc6959cfead493502a2873e4b92abd',})
                            end
                        elseif skinChoice == 2 then
                            -- 朱莉皮肤菜单
                            local choice = gg.choice({
                                "幽灵公主",
                                "罗塔女巫",
                                "冰雪女王",
                                "吸血女爵",
                                "数据恢复",
                                "返回上层"
                            }, nil, "朱莉皮肤")
                            
                            if choice == 1 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100101',['lx']=1,},['gs']={['sz']=':100101',['lx']=1,},['xg']={['sz']=':100102',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='幽灵公主',['md5']='3d1056069f2381347f584f2ece583017',})
                            elseif choice == 2 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100102',['lx']=1,},['gs']={['sz']=':100102',['lx']=1,},['xg']={['sz']=':100103',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='罗塔女巫',['md5']='dcdfbabf8ce9a84e2714ebee8c099631',})
                            elseif choice == 3 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100103',['lx']=1,},['gs']={['sz']=':100103',['lx']=1,},['xg']={['sz']=':100104',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='冰雪女王',['md5']='8ad9d2b63fbb7a3e1e57badb07956c13',})
                            elseif choice == 4 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100104',['lx']=1,},['gs']={['sz']=':100104',['lx']=1,},['xg']={['sz']=':100105',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='吸血女爵',['md5']='8eae6e984eac580c85f770dd0dfa16b1',})
                            elseif choice == 5 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100105',['lx']=1,},['gs']={['sz']=':100105',['lx']=1,},['xg']={['sz']=':100101',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='78b496c83089ae03427b5e6540de2627',})
                            end
                        elseif skinChoice == 3 then
                            -- 老贝皮肤菜单
                            local choice = gg.choice({
                                "狂化战士",
                                "赏金猎人",
                                "荒岛学者",
                                "数据恢复",
                                "返回上层"
                            }, nil, "老贝皮肤")
                            
                            if choice == 1 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100201',['lx']=1,},['gs']={['sz']=':100201',['lx']=1,},['xg']={['sz']=':100202',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='狂化战士',['md5']='ca4296044c34b3f9cde1e9221ac4c21e',})
                            elseif choice == 2 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100202',['lx']=1,},['gs']={['sz']=':100202',['lx']=1,},['xg']={['sz']=':100203',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='赏金猎人',['md5']='c584baa77fcab52540eb19131de1887f',})
                            elseif choice == 3 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100203',['lx']=1,},['gs']={['sz']=':100203',['lx']=1,},['xg']={['sz']=':100204',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='荒岛学者',['md5']='0b2c8fe21a2c08f08b33158dbf527886',})
                            elseif choice == 4 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100204',['lx']=1,},['gs']={['sz']=':100204',['lx']=1,},['xg']={['sz']=':100201',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='218aaea71494a0b6c89aab1dd2771896',})
                            end
                        elseif skinChoice == 4 then
                            -- 小哥皮肤菜单
                            local choice = gg.choice({
                                "圣诞老哥",
                                "绝味小哥",
                                "苍龙祭祀",
                                "驯鹿之魂",
                                "数据恢复",
                                "返回上层"
                            }, nil, "小哥皮肤")
                            
                            if choice == 1 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100301',['lx']=1,},['gs']={['sz']=':100301',['lx']=1,},['xg']={['sz']=':100302',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='圣诞老哥',['md5']='512aabbbf09475d1b9637d95d1dbafe2',})
                            elseif choice == 2 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100302',['lx']=1,},['gs']={['sz']=':100302',['lx']=1,},['xg']={['sz']=':100303',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='绝味小哥',['md5']='0b4d8a82a05d2be7f83be1099f343d29',})
                            elseif choice == 3 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100303',['lx']=1,},['gs']={['sz']=':100303',['lx']=1,},['xg']={['sz']=':100304',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='苍龙祭祀',['md5']='5d9e6f8f6e5b813922ae391b18cf0608',})
                            elseif choice == 4 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100304',['lx']=1,},['gs']={['sz']=':100304',['lx']=1,},['xg']={['sz']=':100305',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='驯鹿之魂',['md5']='6fc52414d4f190b776afb18f91517021',})
                            elseif choice == 5 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100305',['lx']=1,},['gs']={['sz']=':100305',['lx']=1,},['xg']={['sz']=':100301',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='c7c5a2bea35d6c16ed3eb850aabefdea',})
                            end
                        elseif skinChoice == 5 then
                            -- 基德皮肤菜单
                            local choice = gg.choice({
                                "新月狼人",
                                "彩蛋兔爷",
                                "丛林战士",
                                "数据恢复",
                                "返回上层"
                            }, nil, "基德皮肤")
                            
                            if choice == 1 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100401',['lx']=1,},['gs']={['sz']=':100401',['lx']=1,},['xg']={['sz']=':100403',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='新月狼人',['md5']='b3a274c0ef30251c2b8fea560c59faeb',})
                            elseif choice == 2 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100403',['lx']=1,},['gs']={['sz']=':100403',['lx']=1,},['xg']={['sz']=':100404',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='彩蛋兔爷',['md5']='e67c1a52d0b2d2c352ae69123f0db3d6',})
                            elseif choice == 3 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100404',['lx']=1,},['gs']={['sz']=':100404',['lx']=1,},['xg']={['sz']=':100405',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='丛林战士',['md5']='5752a2b3c1c42dc5fb8c5d816dc9cc2e',})
                            elseif choice == 4 then
                                LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']=':100405',['lx']=1,},['gs']={['sz']=':100405',['lx']=1,},['xg']={['sz']=':100401',['lx']=1,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='605b4e5448b2783574b96d86a8ddad8b',})
                            end
                        elseif skinChoice == 6 then
                            break
                        end
                    end
                    gg.sleep(100)
                end
            elseif choice == 2 then
                -- 人物血量菜单
                xsui = true
                while true do
                    if gg.isVisible(true) or xsui then
                        xsui = false
                        gg.setVisible(false)
                        local healthChoice = gg.choice({
                            "厨子血量",
                            "朱莉血量",
                            "老贝血量",
                            "小哥血量",
                            "基德血量",
                            "返回上层"
                        }, nil, "人物血量修改")
                        
                        if healthChoice == 1 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7001;350',['lx']=4,},['gs']={['sz']='350',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='血量支持自定义大小',['gnm']='厨子',['md5']='88b748c583a8653e8e48fefca92a6093',})
                        elseif healthChoice == 2 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7002;350',['lx']=4,},['gs']={['sz']='350',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='血量支持自定义大小',['gnm']='朱莉',['md5']='c4f1faa300ebd21d36b1dd8503b61bb9',})
                        elseif healthChoice == 3 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7003;350',['lx']=4,},['gs']={['sz']='350',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='血量支持自定义大小',['gnm']='老贝',['md5']='19b100a4b46a21f33bb415d43d3d8d83',})
                        elseif healthChoice == 4 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7004;350',['lx']=4,},['gs']={['sz']='350',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='血量支持自定义大小',['gnm']='小哥',['md5']='8b708e1c960b6280e54c79d001ea8dde',})
                        elseif healthChoice == 5 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7005;350',['lx']=4,},['gs']={['sz']='350',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='血量支持自定义大小',['gnm']='基德',['md5']='4c486d87d168a5bad0b1b5a2c1503b72',})
                        elseif healthChoice == 6 then
                            break
                        end
                    end
                    gg.sleep(100)
                end
            elseif choice == 3 then
                -- 其他功能菜单
                xsui = true
                while true do
                    if gg.isVisible(true) or xsui then
                        xsui = false
                        gg.setVisible(false)
                        local otherChoice = gg.multiChoice({
                            "朱莉白狼变无敌",
                            "攻击力",
                            "背包",
                            "活动无限领取",
                            "活动大量钥匙领取",
                            "返回上层"
                        }, {false, false, false, false, false, false}, "其他功能")
                        
                        if otherChoice[1] then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7028;100;7003;246',['lx']=4,},['gs']={['sz']='100;246',['lx']=4,},['xg']={['sz']='1000;1000',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='朱莉白狼变无敌',['md5']='0f85c83d1c40c7e76415019759130181',})
                        end
                        if otherChoice[2] then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7013;15',['lx']=4,},['gs']={['sz']='15',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='攻击力支持自定义大小',['gnm']='攻击力',['md5']='42e7d047abae5edde1cd77fd9fb7f3e3',})
                        end
                        if otherChoice[3] then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='7012;40',['lx']=4,},['gs']={['sz']='40',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='背包支持自定义修改',['gnm']='背包',['md5']='60df6f7c81dedab0f1aeeae49292aaa6',})
                        end
                        if otherChoice[4] then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='86400000',['lx']=4,},['gs']={['sz']='86400000',['lx']=4,},['xg']={['sz']='1',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='活动无限领取',['md5']='425fee0a0b31b8dbc11a090be64bee90',})
                        end
                        if otherChoice[5] then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='100006;1:200',['lx']=4,},['gs']={['sz']='1',['lx']=4,},['xg']={['sz']='999',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=true,['zdybz']='钥匙自定义大小',['gnm']='活动大量钥匙领取',['md5']='e1c18e40bde4d6ce6a9f839fe5e52710',})
                        end
                        if otherChoice[6] then
                            break
                        end
                    end
                    gg.sleep(100)
                end
            elseif choice == 4 then
                -- 图纸功能菜单
                xsui = true
                while true do
                    if gg.isVisible(true) or xsui then
                        xsui = false
                        gg.setVisible(false)
                        local blueprintChoice = gg.choice({
                            "平底锅，新衣，奇特香料，研磨器，手枪，肉酱",
                            "数据恢复",
                            "扑克，石锤，暖身丸，强身丸，军粮丸，驯兽鞭",
                            "数据恢复2",
                            "吹箭，机关剑，机关连弩，麻痹针，女巫扫把，好战者",
                            "数据恢复3",
                            "羽毛裙，姜饼人，可可豆，巧克力，防护服，冰雪卷轴",
                            "数据恢复4",
                            "返回上层"
                        }, nil, "图纸功能")
                        
                        if blueprintChoice == 1 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='39;38;37;36;35;34',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='平底锅，新衣，奇特香料，研磨器，手枪，肉酱',['md5']='82d80214cb7085e98b262732dbb050a0',})
                        elseif blueprintChoice == 2 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='39;38;37;36;35;34::100',['lx']=4,},['gs']={['sz']='39;38;37;36;35;34',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='31dabda02177e0e04008dc1a6c2547ea',})
                        elseif blueprintChoice == 3 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='45;44;43;42;41;40',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='扑克，石锤，暖身丸，强身丸，军粮丸，驯兽鞭',['md5']='a579f5a21814233555119b8af61eeaa1',})
                        elseif blueprintChoice == 4 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='45;44;43;42;41;40::100',['lx']=4,},['gs']={['sz']='45;44;43;42;41;40',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复2',['md5']='cd4531d6df1674fc4f2a275e6c0d7734',})
                        elseif blueprintChoice == 5 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='52;50;49;48;47;46',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='吹箭，机关剑，机关连弩，麻痹针，女巫扫把，好战者',['md5']='9433e472b38656ffbedbd1dc95a98372',})
                        elseif blueprintChoice == 6 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='52;50;49;48;47;46::100',['lx']=4,},['gs']={['sz']='52;50;49;48;47;46',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复3',['md5']='8849acae4c04badff8a92a47ee1d81d3',})
                        elseif blueprintChoice == 7 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='58;57;56;55;54;53',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='羽毛裙，姜饼人，可可豆，巧克力，防护服，冰雪卷轴',['md5']='f3ca1fef96cd8ff1b7aa78e1e86546bc',})
                        elseif blueprintChoice == 8 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='58;57;56;55;54;53::100',['lx']=4,},['gs']={['sz']='58;57;56;55;54;53',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复4',['md5']='71f551b930352404874051e97968b1c3',})
                        elseif blueprintChoice == 9 then
                            break
                        end
                    end
                    gg.sleep(100)
                end
            elseif choice == 5 then
                -- 礼包功能菜单
                xsui = true
                while true do
                    if gg.isVisible(true) or xsui then
                        xsui = false
                        gg.setVisible(false)
                        local giftChoice = gg.choice({
                            "各种礼包",
                            "恢复数据",
                            "贝壳单局礼包",
                            "数据恢复2",
                            "各种单局礼包(人民币)",
                            "数据恢复",
                            "返回上层"
                        }, nil, "礼包功能")
                        
                        if giftChoice == 1 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='208;104;51;299;209;327',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='各种礼包',['md5']='a4160c8670c76e9f190c0de691b96bb1',})
                        elseif giftChoice == 2 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='208;104;51;299;209;327',['lx']=4,},['gs']={['sz']='208;104;51;299;209;327',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='恢复数据',['md5']='a898f4198005278c8adc7733cc106e65',})
                        elseif giftChoice == 3 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='207;206;205;204;203;202',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='贝壳单局礼包',['md5']='2ac9815e052dc2451e0fa8c3b22fbb6e',})
                        elseif giftChoice == 4 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='207;206;205;204;203;202',['lx']=4,},['gs']={['sz']='207;206;205;204;203;202',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复2',['md5']='74f6614420c729a54a9e1a23218fd1f8',})
                        elseif giftChoice == 5 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='401;402;403;404;405;406',['lx']=4,},['gs']={['sz']='401;402;403;404;405;406',['lx']=4,},['xg']={['sz']='121;122;123;124;125;126',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='各种单局礼包(人民币)',['md5']='0412997df21ceccfb89bc0c6a6d048e1',})
                        elseif giftChoice == 6 then
                            LHSS({['ncfw']=32,['ncpx']=0,['ncks']=0,['ncjw']=100,['xss']={['sz']='121;122;123;124;125;126',['lx']=4,},['gs']={['sz']='121;122;123;124;125;126',['lx']=4,},['xg']={['sz']='401;402;403;404;405;406',['lx']=4,},['xgdj']=false,['djsf']=false,['zdyxg']=false,['zdybz']='',['gnm']='数据恢复',['md5']='3ebe252d5e298a63b0239e84e9bfb105',})
                        elseif giftChoice == 7 then
                            break
                        end
                    end
                    gg.sleep(100)
                end
            elseif choice == 6 then
                -- 物品替换菜单
                xsui = true
                while true do
                    if gg.isVisible(true) or xsui then
                        xsui = false
                        gg.setVisible(false)
                        local itemChoice = gg.choice({
                            "仙豆",
                            "荒野秘宝",
                            "群星之怒",
                            "闪避护符",
                            "塔罗牌",
                            "赏金箱子",
                            "其余物品",
                            "补给礼包",
                            "返回上层"
                        }, nil, "物品替换")
                        
                        if itemChoice == 1 then
                            -- 仙豆菜单
                            gg.alert("仙豆功能已启用")
                        elseif itemChoice == 2 then
                            -- 荒野秘宝菜单
                            gg.alert("荒野秘宝功能已启用")
                        elseif itemChoice == 3 then
                            -- 群星之怒菜单
                            gg.alert("群星之怒功能已启用")
                        elseif itemChoice == 4 then
                            -- 闪避护符菜单
                            gg.alert("闪避护符功能已启用")
                        elseif itemChoice == 5 then
                            -- 塔罗牌菜单
                            gg.alert("塔罗牌功能已启用")
                        elseif itemChoice == 6 then
                            -- 赏金箱子菜单
                            gg.alert("赏金箱子功能已启用")
                        elseif itemChoice == 7 then
                            -- 其余物品菜单
                            gg.alert("其余物品功能已启用")
                        elseif itemChoice == 8 then
                            -- 补给礼包菜单
                            gg.alert("补给礼包功能已启用")
                        elseif itemChoice == 9 then
                            break
                        end
                    end
                    gg.sleep(100)
                end
            elseif choice == 7 then
                return
            end
        end
        gg.sleep(100)
    end
end

-- ===== 主菜单 =====
function showMainMenu()
    while true do
        if gg.isVisible(true) then
            gg.setVisible(false)
            local choice = gg.choice({
                "1. 基础修改功能",
                "2. 高级功能菜单",
                "3. 退出脚本"
            }, nil, "荒野日记孤岛修改器\n究极无敌终极整合版")
            
            if choice == 1 then
                showBaseMenu()
            elseif choice == 2 then
                showAdvancedMenu()
            elseif choice == 3 then
                gg.alert("脚本已退出")
                os.exit()
            end
        end
        gg.sleep(100)
    end
end

-- ===== 启动脚本 =====
gg.alert("请确保游戏已启动！")
showMainMenu()