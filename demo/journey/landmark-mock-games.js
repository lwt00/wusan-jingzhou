/* 开发验证适配器；与正式小游戏使用相同 mount/complete/cancel 接口。 */
(()=>{
  for(const [id,place] of Object.entries(window.WusanLandmarkConfig.landmarks)){
    window.WusanLandmarkGames.register(`mock-${id}`,{
      mount({container,levelId,complete,cancel}){
        const block=document.createElement('div');block.className='mock-exploration';
        const title=document.createElement('h2');title.textContent=`${place.name} · 探索模拟接口`;
        const note=document.createElement('p');note.textContent='开发测试，非正式小游戏。迷雾已局部拨开；点击模拟完成，可检验整片区域散雾、文化盖章和进度保存。';
        const done=document.createElement('button');done.textContent='模拟探索完成';done.dataset.mockComplete=levelId;
        const leave=document.createElement('button');leave.textContent='暂不完成，返回地标';
        let closed=false;
        const finish=()=>{if(closed)return;closed=true;done.disabled=true;complete({completed:true,levelId});};
        const exit=()=>{if(closed)return;closed=true;cancel();};
        done.addEventListener('click',finish);leave.addEventListener('click',exit);
        block.append(title,note,done,leave);container.append(block);done.focus({preventScroll:true});
        return()=>{closed=true;done.removeEventListener('click',finish);leave.removeEventListener('click',exit);block.remove();};
      }
    });
  }
})();
