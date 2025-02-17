<script setup lang="ts">
import type { Matrix } from "mathjs";

import * as math from 'mathjs';
import { ref } from "vue";

// six directions
const front=math.matrix([1,0,0]);
const back=math.matrix([-1,0,0]);
const left=math.matrix([0,-1,0]);
const right=math.matrix([0,1,0]);
const up=math.matrix([0,0,1]);
const down=math.matrix([0,0,-1]);

// input: a vector
// output: a matrix rotate pi/2 anticlockwise the input vector
// you should not input vector beyond the 6
function vec2mtr(vec:Matrix){
    return math.rotationMatrix(-math.pi/2,vec).map((a,b,c)=>Math.round(a));
}

class Cube{
    rotation:Matrix;
    color:Map<string,string>;
    id:Array<number>;

    constructor(rotation?:Matrix,color?:Map<string,string>,id?:Array<number>){
        this.rotation=rotation?rotation:math.identity(3) as Matrix;
        if(color)
            this.color=color;
        else{
            this.color=new Map();
            this.color.set(front.toString(),'orange');
            this.color.set(back.toString(),'red');
            this.color.set(left.toString(),'blue');
            this.color.set(right.toString(),'green_');
            this.color.set(up.toString(),'white');
            this.color.set(down.toString(),'yellow');
        }
        this.id=id?id:[0,0,0];
    }
    copy():Cube{
        return new Cube(this.rotation,new Map(this.color),new Array(...this.id));
    }
    rotate(F:Matrix):Cube{
        return new Cube(math.multiply(F,this.rotation),new Map(this.color),new Array(...this.id));
    }
    // input the 6
    look(angle:Matrix):string|undefined{
        const face=math.multiply(angle,this.rotation).toString();
        return this.color.get(face);
    };
};

class Cube3{
    cubes:Array<Cube>;
    
    constructor(cubes?:Array<Cube>){
        if(cubes){
            this.cubes=cubes;
            return;
        }
        this.cubes=new Array<Cube>(27);
        for(let i=0;i<27;i++)
            this.cubes[i]=new Cube(),
            this.cubes[i].id=Cube3.id2xyz(i);
    }
    copy():Cube3{
        return new Cube3(this.cubes.map(cube=>cube.copy()));
    }
    static xyz2id(x:number,y:number,z:number):number{
        return Math.round(x+y*3+z*9+13);
    }
    static id2xyz(id:number):Array<number>{
        return [Math.floor(id+0.01)%3-1,Math.floor(id/3+0.01)%3-1,Math.floor(id/9+0.01)-1];
    }
    _rotate(f:Matrix,first_layer:boolean=true):Cube3{
        const l=(x:number)=>(first_layer && x!==0)?x:-1;
        const r=(x:number)=>(first_layer && x!==0)?x:1;
        const F=vec2mtr(f);

        const res=this.copy();
        for(let x=l(f.get([0]));x<=r(f.get([0]));x++)
        for(let y=l(f.get([1]));y<=r(f.get([1]));y++)
        for(let z=l(f.get([2]));z<=r(f.get([2]));z++){
            const id=Cube3.xyz2id(x,y,z);
            const [nx,ny,nz]=math.multiply(F,[x,y,z]).toArray().map((v,i,a)=>v as number);
            const nid=Cube3.xyz2id(nx,ny,nz);
            res.cubes[nid]=this.cubes[id].rotate(F);
        }
        return res;
    }
    rotate(token:string):Cube3|undefined{
        switch(token){
            case 'F':
                return this._rotate(front);
            case 'B':
                return this._rotate(back);
            case 'L':
                return this._rotate(left);
            case 'R':
                return this._rotate(right);
            case 'U':
                return this._rotate(up);
            case 'D':
                return this._rotate(down);
            case 'x':
                return this._rotate(right,false);
            case 'y':
                return this._rotate(up,false);
            case 'z':
                return this._rotate(front,false);
        }
    }
    // get color of certain surface
    color(index:number):string{
        const col=(index-1)%12;
        const row=(index-1-col)/12;

        // front
        if(1*3<=row && row<2*3 && 1*3<=col && col<2*3)
            return this.cubes[Cube3.xyz2id(1,col-(1*3+1),(1*3+1)-row)].look(front) as string;
        
        // back
        if(1*3<=row && row<2*3 && 3*3<=col && col<4*3)
            return this.cubes[Cube3.xyz2id(-1,(3*3+1)-col,(1*3+1)-row)].look(back) as string;
        
        // left
        if(1*3<=row && row<2*3 && 0*3<=col && col<1*3)
            return this.cubes[Cube3.xyz2id(col-(0*3+1),-1,(1*3+1)-row)].look(left) as string;

        // right
        if(1*3<=row && row<2*3 && 2*3<=col && col<3*3)
            return this.cubes[Cube3.xyz2id((2*3+1)-col,1,(1*3+1)-row)].look(right) as string;

        // up
        if(0*3<=row && row<1*3 && 1*3<=col && col<2*3)
            return this.cubes[Cube3.xyz2id(row-(0*3+1),col-(1*3+1),1)].look(up) as string;
        
        // down
        if(2*3<=row && row<3*3 && 1*3<=col && col<2*3)
            return this.cubes[Cube3.xyz2id((2*3+1)-row,col-(1*3+1),-1)].look(down) as string;
        
        return '';
    }
    /*
    __color(index:number):ComputedRef<Array<string>>{
        return computed(()=>['square',this.color(index)]);
    }
    */
};

const cube3=ref([new Cube3()]);
let tokens=new Array();
const error=ref('');
const show_history=ref(false);

function onInput(event:Event):void{
    const input=(event.target as HTMLInputElement).value as string;
    const good=(c:string)=>{
        switch(c){
            case 'F':
            case 'B':
            case 'L':
            case 'R':
            case 'U':
            case 'D':
            case 'x':
            case 'y':
            case 'z':
                return true;
        }
        return false;
    };

    // parse the input formula
    error.value='';
    const t_tokens=[];
    for(let i=0;i<input.length;i++){
        const c=input[i];
        if(good(c))
            t_tokens.push([c,1]);
        else if(c==='\''){
            if(i==0 || !good(input[i-1]))
                error.value+=`第 ${i+1} 个字符为 '\'' 但前一个字符不是表示转动的字母\n`;
            else
                t_tokens[t_tokens.length-1][1]=3;
        }
        else if(c==='2')
            t_tokens[t_tokens.length-1][1]=(t_tokens[t_tokens.length-1][1] as number)*2%4;
        else if(c!==' ' && c!=='\n')
            error.value+=`第 ${i+1} 个字符 ${c} 不是合法字符\n`;
    }

    // update cube3
    let i=0;
    for(;i<t_tokens.length;i++)
        if(i>=tokens.length || tokens[i][0]!==t_tokens[i][0] || tokens[i][1]!==t_tokens[i][1])
            break;
    tokens=t_tokens;
    for(;i<tokens.length;i++){
        let cur=cube3.value[i];
        for(let j=0;j<(tokens[i][1] as number);j++)
            cur=cur.rotate(tokens[i][0] as string) as Cube3;
        cube3.value[i+1]=cur;
    }
    while(cube3.value.length-1>tokens.length)
        cube3.value.pop();
}

</script>

<template>
  <div class="mydiv">
    <h1>大家好啊，我是<a href="https://github.com/AtomFirst/MyRubikCube">魔方</a></h1>
    
    <textarea rows="10" cols="50" autofocus placeholder="输入公式（支持符号：FBLRUDxyz'2）" @input="onInput" />
    <button @click="show_history=!show_history"><span v-if="show_history">不</span>展示过程</button>
    <pre>{{ error }}</pre>
    
    <ul class="list">
        <div v-for="i in (show_history?cube3.length:1)">
            <h2>{{ cube3.length-i }}</h2>
            <div class="surface-development">
                <div v-for="j in 108" :class="['square',cube3[cube3.length-i].color(j)]"></div>
            </div>
        </div>
    </ul>
  </div>
</template>

<style scoped>
.surface-development {
  display: grid;
  grid-template-columns: repeat(12, 1em);
  grid-template-rows: repeat(9, 1em);
  gap: 0.05em;
}

.square {
  width: 1em;
  height: 1em;
}

.list {
  list-style-type: none; /* 去掉默认的列表符号 */
  padding: 0;
  margin: 1.5em;
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 10px; /* 可选：设置列表项之间的间距 */
}

.mydiv {
    padding: 1.5em;
}

.blue{
    background-color:blue;
}
.orange{
    background-color:orange;
}
.green_{
    background-color:green;
}   
.red{
    background-color:red;
}
.white{
    background-color:white;
}
.yellow{
    background-color:yellow;
}

h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}
</style>
