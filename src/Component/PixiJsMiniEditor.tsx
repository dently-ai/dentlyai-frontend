/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";

import { Application, Assets, ICanvas, Sprite, Graphics } from 'pixi.js';
import { EventSystem } from '@pixi/events'
import { Alignment, AnchorButton, Button, ButtonGroup, Classes, H5, Icon, Intent, Switch } from "@blueprintjs/core";
import { Example, ExampleProps, handleBooleanChange } from "@blueprintjs/docs-theme";
import { Tooltip2 } from "@blueprintjs/popover2";

interface IGridOptions {
    x: number,
    y: number,
    rows: number,
    cols: number,
    size: number
}

interface IPixiJsAppProps {
    pixiHandler: (pixi: Application<ICanvas>) => void;
}

function renderGrid(options?: IGridOptions | undefined): Graphics
{
    var graphics = new Graphics();

    // Rectangle
    graphics.beginFill(0xDE3249);
    graphics.drawRect(50, 50, 100, 100);
    graphics.endFill();

    //graphics.drawLine

    return graphics;
}

export class PixiJsMiniEditor extends React.PureComponent<IPixiJsAppProps> {
    pixiApp: Application<ICanvas> | undefined;
    canvas: HTMLCanvasElement | undefined;

    public async componentDidMount(): Promise<void> {
        // The application will create a renderer using WebGL, if possible,
        // with a fallback to a canvas render. It will also setup the ticker
        // and the root stage PIXI.Container
        this.pixiApp = new Application({
            view: this.canvas,
            antialias: true,
        });
        
        
        const { pixiApp } = this;
        const { renderer, stage } = pixiApp;

        renderer.resize(400, 400);

        const { pixiHandler } = this.props;
        pixiHandler(pixiApp);
    }

    public render() {
        return (
            <canvas ref={(c) => this.canvas = (c != null ? c : undefined)}>
            </canvas>
        );
    }
}