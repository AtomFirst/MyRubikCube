import type { Matrix } from 'mathjs';
import * as math from 'mathjs';

type Direction = 'front' | 'back' | 'left' | 'right' | 'up' | 'down';

type RotationVectorMap = { [key in Direction]: Matrix };
const defaultRotationVectorMap: RotationVectorMap = {
    front: math.matrix([1, 0, 0]),
    back: math.matrix([-1, 0, 0]),
    left: math.matrix([0, -1, 0]),
    right: math.matrix([0, 1, 0]),
    up: math.matrix([0, 0, 1]),
    down: math.matrix([0, 0, -1]),
} as const;
const getRotationVector = (direction: Direction) => defaultRotationVectorMap[direction];
const getRotationMatrix = (direction: Direction) => math.rotationMatrix(-math.pi / 2, getRotationVector(direction)).map((a) => Math.round(a));

type DirectionMap = { [key in string]: Direction };
const defaultDirectionMap: DirectionMap = {
    [getRotationVector('front').toString()]: 'front',
    [getRotationVector('back').toString()]: 'back',
    [getRotationVector('left').toString()]: 'left',
    [getRotationVector('right').toString()]: 'right',
    [getRotationVector('up').toString()]: 'up',
    [getRotationVector('down').toString()]: 'down',
} as const;
/*
Object.keys(defaultRotationVectorMap).reduce((acc, cur) => {
    cur[getRotationVector(acc as Direction).toString()] = acc;
    return cur;
}, {});
*/
const getDirection = (rotationVector: Matrix) => defaultDirectionMap[rotationVector.toString()];

type ColorMap = { [key in Direction]: string };
const defaultColorMap: ColorMap = {
    front: 'green',
    back: 'blue',
    left: 'orange',
    right: 'red',
    up: 'white',
    down: 'yellow',
} as const;

class Cube {
    rotation: Matrix;
    colorMap: ColorMap;
    id: Array<number>;

    constructor(rotation: Matrix = math.identity(3) as Matrix, colorMap: ColorMap = defaultColorMap, id: Array<number> = [0, 0, 0]) {
        this.rotation = rotation;
        this.colorMap = colorMap;
        this.id = id;
    }

    copy(): Cube {
        return new Cube(this.rotation, { ...this.colorMap }, [...this.id]);
    }

    rotate(rotationMatrix: Matrix): Cube {
        return new Cube(math.multiply(rotationMatrix, this.rotation), { ...this.colorMap }, [...this.id]);
    }

    look(angle: Direction): string {
        const face = math.multiply(getRotationVector(angle), this.rotation);
        return this.colorMap[getDirection(face)];
    }
}

export type Token = 'F' | 'B' | 'L' | 'R' | 'U' | 'D' | 'f' | 'b' | 'l' | 'r' | 'u' | 'd' | 'x' | 'y' | 'z' | 'M' | 'S' | 'E';

export class Cube3 {
    cubes: Array<Cube>;

    constructor(cubes?: Array<Cube>) {
        if (cubes) {
            this.cubes = cubes;
            return;
        }
        this.cubes = new Array<Cube>(27);
        for (let i = 0; i < 27; i++) (this.cubes[i] = new Cube()), (this.cubes[i].id = Cube3.id2xyz(i));
    }

    copy(): Cube3 {
        return new Cube3(this.cubes.map((cube) => cube.copy()));
    }

    static xyz2id(x: number, y: number, z: number): number {
        return Math.round(x + y * 3 + z * 9 + 13);
    }

    static id2xyz(id: number): Array<number> {
        return [(Math.floor(id + 0.01) % 3) - 1, (Math.floor(id / 3 + 0.01) % 3) - 1, Math.floor(id / 9 + 0.01) - 1];
    }

    _rotate(direction: Direction, layer: 'first' | 'middle' | 'first_middle' | 'all' = 'first'): Cube3 {
        const lMap = {
            first: (x: number) => (x !== 0 ? x : -1),
            middle: (x: number) => (x !== 0 ? 0 : -1),
            first_middle: (x: number) => (x !== 0 ? Math.min(0, x) : -1),
            all: () => -1,
        } as const;

        const rMap = {
            first: (x: number) => (x !== 0 ? x : 1),
            middle: (x: number) => (x !== 0 ? 0 : 1),
            first_middle: (x: number) => (x !== 0 ? Math.max(0, x) : 1),
            all: () => 1,
        } as const;

        const l = lMap[layer];
        const r = rMap[layer];

        const f = getRotationVector(direction);
        const F = getRotationMatrix(direction);

        const res = this.copy();
        for (let x = l(f.get([0])); x <= r(f.get([0])); x++)
            for (let y = l(f.get([1])); y <= r(f.get([1])); y++)
                for (let z = l(f.get([2])); z <= r(f.get([2])); z++) {
                    const id = Cube3.xyz2id(x, y, z);
                    const [nx, ny, nz] = math
                        .multiply(F, [x, y, z])
                        .toArray()
                        .map((v) => v as number);
                    const nid = Cube3.xyz2id(nx, ny, nz);
                    res.cubes[nid] = this.cubes[id].rotate(F);
                }
        return res;
    }

    rotate(token: Token): Cube3 {
        const Rotations: { [key in string]: (base: Cube3) => Cube3 } = {
            F: (base) => base._rotate('front'),
            B: (base) => base._rotate('back'),
            L: (base) => base._rotate('left'),
            R: (base) => base._rotate('right'),
            U: (base) => base._rotate('up'),
            D: (base) => base._rotate('down'),

            f: (base) => base._rotate('front', 'first_middle'),
            b: (base) => base._rotate('back', 'first_middle'),
            l: (base) => base._rotate('left', 'first_middle'),
            r: (base) => base._rotate('right', 'first_middle'),
            u: (base) => base._rotate('up', 'first_middle'),
            d: (base) => base._rotate('down', 'first_middle'),

            M: (base) => base._rotate('right', 'middle'),
            S: (base) => base._rotate('front', 'middle'),
            E: (base) => base._rotate('up', 'middle'),

            x: (base) => base._rotate('right', 'all'),
            y: (base) => base._rotate('up', 'all'),
            z: (base) => base._rotate('front', 'all'),
        };

        return Rotations[token](this);
    }

    // get getColor of certain surface
    getColor(index: number): string {
        const col = (index - 1) % 12;
        const row = (index - 1 - col) / 12;

        // front
        if (1 * 3 <= row && row < 2 * 3 && 1 * 3 <= col && col < 2 * 3) return this.cubes[Cube3.xyz2id(1, col - (1 * 3 + 1), 1 * 3 + 1 - row)].look('front');
        // back
        if (1 * 3 <= row && row < 2 * 3 && 3 * 3 <= col && col < 4 * 3) return this.cubes[Cube3.xyz2id(-1, 3 * 3 + 1 - col, 1 * 3 + 1 - row)].look('back');
        // left
        if (1 * 3 <= row && row < 2 * 3 && 0 * 3 <= col && col < 1 * 3) return this.cubes[Cube3.xyz2id(col - (0 * 3 + 1), -1, 1 * 3 + 1 - row)].look('left');
        // right
        if (1 * 3 <= row && row < 2 * 3 && 2 * 3 <= col && col < 3 * 3) return this.cubes[Cube3.xyz2id(2 * 3 + 1 - col, 1, 1 * 3 + 1 - row)].look('right');
        // up
        if (0 * 3 <= row && row < 1 * 3 && 1 * 3 <= col && col < 2 * 3) return this.cubes[Cube3.xyz2id(row - (0 * 3 + 1), col - (1 * 3 + 1), 1)].look('up');
        // down
        if (2 * 3 <= row && row < 3 * 3 && 1 * 3 <= col && col < 2 * 3) return this.cubes[Cube3.xyz2id(2 * 3 + 1 - row, col - (1 * 3 + 1), -1)].look('down');
        return '';
    }

    format(): string {
        let fmt = '';
        for (let i = 1; i <= 108; i++) {
            const c = this.getColor(i);
            fmt += c ? c[0] : ' ';
            if (i !== 1 && i != 108 && i % 12 === 0) fmt += '\n';
        }
        return fmt;
    }
}
