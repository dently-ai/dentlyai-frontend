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

import { Alignment, AnchorButton, Button, ButtonGroup, Card, Classes, ControlGroup, H5, HTMLSelect, Icon, InputGroup, Intent, Label, Slider, Switch } from "@blueprintjs/core";
import { Example, ExampleProps, handleBooleanChange } from "@blueprintjs/docs-theme";
import { Tooltip2 } from "@blueprintjs/popover2";

export interface ICalibrationControlProps {
    handleCalibration?: () => void;
}

export interface ICalibrationControlState {
    isCalibrationActive?: boolean;
}

export class CalibrationControl extends React.PureComponent<ICalibrationControlProps, ICalibrationControlState> {
    public state: ICalibrationControlState = {
        isCalibrationActive: false,
    };

    public render() {
        const { isCalibrationActive, } = this.state;

        return (
            <ControlGroup className="level margin-fix" {...this.state}>
                <div className="level-left">
                    <Button
                        icon="settings"
                        text="Calibrate image size"
                        onClick={this.onCalibrateImageButtonClicked.bind(this)}
                    />
                </div>
                <div className="level-right">
                    <InputGroup
                        placeholder="Size"
                        type="number"
                        disabled={!isCalibrationActive}
                    />
                    <Button
                        icon="arrow-right"
                        disabled={!isCalibrationActive}
                        onClick={this.onCalibrationSubmitted.bind(this)}
                    />
                </div>
            </ControlGroup>
        );
    }

    private onCalibrationSubmitted() {
        this.toggleCalibration();
    }

    private onCalibrateImageButtonClicked() {
        this.toggleCalibration();
    }

    private toggleCalibration() {
        const { isCalibrationActive, } = this.state;
        this.setState({ isCalibrationActive: !isCalibrationActive });

        const { handleCalibration, } = this.props;

        if (handleCalibration != undefined) {
            handleCalibration();
        }
    }
}